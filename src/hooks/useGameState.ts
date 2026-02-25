import { useState, useCallback, useRef } from 'react'
import type { DrinkOrder, BaseType, MilkType, PoolType } from '../data/drinkMatrix'
import { getDrinkPool } from '../data/drinkMatrix'
import {
  STARTING_LIVES,
  TRANSITION_DURATION_MS,
  LEVEL_TRANSITION_MS,
  LEVELS,
  CROWD_COMMENTS,
  getLevelForCup,
  type LevelConfig,
} from '../data/gameConfig'
import { createEmptyCup, validateOrder, getOrderMismatches, type CupContents, type OrderMismatch } from '../utils/orderValidation'
import { calculateScore } from '../utils/scoring'
import { useTimer } from './useTimer'
import { ShuffleCycle, WRONG_REACTIONS, CORRECT_REACTIONS } from '../data/reactions'
import { QUOTES } from '../data/quotes'
import { REGULARS, createRegularAssignments, tryGetRegular, type RegularDrinkAssignment } from '../data/regulars'

export type GamePhase = 'idle' | 'playing' | 'transition' | 'levelup' | 'gameover' | 'errorAck'
export type OrderResult = 'correct' | 'wrong' | 'timeout' | null

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateOrder(poolType: PoolType): DrinkOrder {
  const pool = getDrinkPool(poolType)
  return pickRandom(pool)
}

export interface CustomerAppearance {
  skinTone: string
  hairStyle: number
  shirtColor: string
  ethnicity: string
}

const ETHNICITIES = ['Chinese', 'Malay', 'Indian', 'Eurasian', 'Southeast Asian']
const SKIN_TONES = ['#FDDCB1', '#E8B87E', '#8D5524', '#C68642', '#D4A574']
const SHIRT_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E']

function generateCustomerAppearance(): CustomerAppearance {
  return {
    skinTone: pickRandom(SKIN_TONES),
    hairStyle: Math.floor(Math.random() * 8),
    shirtColor: pickRandom(SHIRT_COLORS),
    ethnicity: pickRandom(ETHNICITIES),
  }
}

export function useGameState() {
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(STARTING_LIVES)
  const [phase, setPhase] = useState<GamePhase>('idle')
  const [currentOrder, setCurrentOrder] = useState<DrinkOrder | null>(null)
  const [cup, setCup] = useState<CupContents>(createEmptyCup())
  const [orderResult, setOrderResult] = useState<OrderResult>(null)
  const [lastPoints, setLastPoints] = useState(0)
  const [expletive, setExpletive] = useState('')
  const [correctReaction, setCorrectReaction] = useState('')
  const [lessToggle, setLessToggle] = useState(false)
  const [sugarLessToggle, setSugarLessToggle] = useState(false)
  const [condensedLessToggle, setCondensedLessToggle] = useState(false)
  const [customer, setCustomer] = useState<CustomerAppearance>(generateCustomerAppearance())
  const [queueCustomers, setQueueCustomers] = useState<CustomerAppearance[]>([])

  // Level progression
  const [cupNumber, setCupNumber] = useState(0) // total correct cups served
  const [level, setLevel] = useState<LevelConfig>(LEVELS[0])
  const [levelUpComment, setLevelUpComment] = useState('')

  // Error explanation
  const [mismatches, setMismatches] = useState<OrderMismatch[]>([])

  // Regular customer tracking
  const [isRegular, setIsRegular] = useState(false)
  const [regularName, setRegularName] = useState('')
  const [isSecondVisit, setIsSecondVisit] = useState(false)

  const scoreRef = useRef(score)
  scoreRef.current = score
  const livesRef = useRef(lives)
  livesRef.current = lives
  const cupNumberRef = useRef(0)
  const levelRef = useRef<LevelConfig>(LEVELS[0])
  const orderNumberRef = useRef(0) // sequential customer number (correct or not)
  const regularAssignmentsRef = useRef<RegularDrinkAssignment[]>([])
  const ordersSinceRegularRef = useRef(99) // start high so first eligible order can trigger
  const currentRegularRef = useRef<number | null>(null) // index into REGULARS for current customer
  const totalTimeUsedRef = useRef(0) // total seconds spent on correctly served drinks
  const wrongCycleRef = useRef(new ShuffleCycle(WRONG_REACTIONS))
  const correctCycleRef = useRef(new ShuffleCycle(CORRECT_REACTIONS))
  const quoteCycleRef = useRef(new ShuffleCycle(QUOTES))
  const [currentQuote, setCurrentQuote] = useState('')

  const handleTimeout = useCallback(() => {
    setOrderResult('timeout')
    // Use regular-specific reaction if applicable
    if (currentRegularRef.current !== null) {
      setExpletive(REGULARS[currentRegularRef.current].wrongReaction)
    } else {
      setExpletive(wrongCycleRef.current.next())
    }
    const newLives = livesRef.current - 1
    setLives(newLives)

    if (newLives <= 0) {
      setTimeout(() => setPhase('gameover'), TRANSITION_DURATION_MS)
    } else {
      setPhase('transition')
      setTimeout(() => {
        advanceToNextCustomer()
      }, TRANSITION_DURATION_MS)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const timer = useTimer({
    duration: LEVELS[0].timerSeconds,
    onTimeout: handleTimeout,
  })

  const generateQueue = useCallback((size: number) => {
    return Array.from({ length: size }, () => generateCustomerAppearance())
  }, [])

  const setupCustomerForOrder = useCallback((_orderNum: number, currentLevel: LevelConfig) => {
    // Try to trigger a regular based on current level
    ordersSinceRegularRef.current++
    const regularResult = tryGetRegular(
      regularAssignmentsRef.current,
      currentLevel.level,
      ordersSinceRegularRef.current,
    )

    if (regularResult) {
      const regular = REGULARS[regularResult.assignment.regularIndex]
      setCustomer(regular.appearance)
      setCurrentOrder(regularResult.assignment.drink)
      setIsRegular(true)
      setRegularName(regular.name)
      setIsSecondVisit(regularResult.isSecondVisit)
      currentRegularRef.current = regularResult.assignment.regularIndex
      ordersSinceRegularRef.current = 0
    } else {
      const order = generateOrder(currentLevel.drinkPool)
      setCurrentOrder(order)
      setIsRegular(false)
      setRegularName('')
      setIsSecondVisit(false)
      currentRegularRef.current = null

      setQueueCustomers(prev => {
        const newCustomer = generateCustomerAppearance()
        setCustomer(prev[0] || generateCustomerAppearance())
        return [...prev.slice(1), newCustomer]
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const advanceToNextCustomer = useCallback(() => {
    const currentLevel = levelRef.current
    orderNumberRef.current++

    setCup(createEmptyCup())
    setOrderResult(null)
    setLastPoints(0)
    setExpletive('')
    setCorrectReaction('')
    setMismatches([])
    setLessToggle(false)
    setSugarLessToggle(false)
    setCondensedLessToggle(false)

    setupCustomerForOrder(orderNumberRef.current, currentLevel)

    setPhase('playing')
    timer.start(currentLevel.timerSeconds)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startGame = useCallback(() => {
    setScore(0)
    setLives(STARTING_LIVES)
    setCupNumber(0)
    setLevel(LEVELS[0])
    setLevelUpComment('')
    scoreRef.current = 0
    livesRef.current = STARTING_LIVES
    cupNumberRef.current = 0
    orderNumberRef.current = 1 // first customer is order #1
    levelRef.current = LEVELS[0]
    totalTimeUsedRef.current = 0
    wrongCycleRef.current.reset()
    correctCycleRef.current.reset()
    quoteCycleRef.current.reset()

    // Create regular customer assignments for this session
    regularAssignmentsRef.current = createRegularAssignments('full')
    ordersSinceRegularRef.current = 99 // allow first eligible order to trigger
    currentRegularRef.current = null

    const queue = generateQueue(LEVELS[0].queueSize)
    setQueueCustomers(queue)

    setCup(createEmptyCup())
    setOrderResult(null)
    setLastPoints(0)
    setExpletive('')
    setCorrectReaction('')
    setMismatches([])
    setLessToggle(false)
    setSugarLessToggle(false)
    setCondensedLessToggle(false)

    // Set up first customer (may be a regular)
    setupCustomerForOrder(1, LEVELS[0])

    setPhase('playing')
    timer.start(LEVELS[0].timerSeconds)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Dispenser actions
  const addBase = useCallback((base: BaseType) => {
    if (phase !== 'playing') return
    const units = lessToggle ? 0.5 : 1

    setCup(prev => ({
      ...prev,
      base: prev.base === null ? base : prev.base,
      baseUnits: prev.base === null || prev.base === base
        ? prev.baseUnits + units
        : prev.baseUnits,
    }))
  }, [phase, lessToggle])

  const toggleLess = useCallback(() => {
    if (phase !== 'playing') return
    setLessToggle(prev => !prev)
  }, [phase])

  const setMilk = useCallback((milk: MilkType) => {
    if (phase !== 'playing') return
    setCup(prev => {
      if (prev.milk !== 'None') return prev
      const milkUnits = (milk === 'Condensed' && condensedLessToggle) ? 0.5 : 1
      return { ...prev, milk, milkUnits }
    })
  }, [phase, condensedLessToggle])

  const addSugar = useCallback(() => {
    if (phase !== 'playing') return
    setCup(prev => {
      if (prev.sugar !== 'None') return prev
      return { ...prev, sugar: sugarLessToggle ? 'Half' : 'Full' }
    })
  }, [phase, sugarLessToggle])

  const toggleSugarLess = useCallback(() => {
    if (phase !== 'playing') return
    setSugarLessToggle(prev => !prev)
  }, [phase])

  const toggleCondensedLess = useCallback(() => {
    if (phase !== 'playing') return
    setCondensedLessToggle(prev => !prev)
  }, [phase])

  const addIce = useCallback(() => {
    if (phase !== 'playing') return
    setCup(prev => ({ ...prev, hasIce: true }))
  }, [phase])

  const addHotWater = useCallback(() => {
    if (phase !== 'playing') return
    setCup(prev => ({ ...prev, hasHotWater: true }))
  }, [phase])

  const discardCup = useCallback(() => {
    if (phase !== 'playing') return
    setCup(createEmptyCup())
    setLessToggle(false)
    setSugarLessToggle(false)
    setCondensedLessToggle(false)
  }, [phase])

  const acknowledgeError = useCallback(() => {
    if (livesRef.current <= 0) {
      setTimeout(() => setPhase('gameover'), TRANSITION_DURATION_MS)
    } else {
      setPhase('transition')
      setTimeout(() => {
        advanceToNextCustomer()
      }, TRANSITION_DURATION_MS)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const serve = useCallback(() => {
    if (phase !== 'playing' || !currentOrder) return
    timer.stop()

    const isCorrect = validateOrder(cup, currentOrder)

    if (isCorrect) {
      const timeUsed = levelRef.current.timerSeconds - timer.secondsRemaining
      totalTimeUsedRef.current += timeUsed

      const points = calculateScore(timer.secondsRemaining, levelRef.current.scoreMultiplier)
      const newScore = scoreRef.current + points
      setScore(newScore)
      scoreRef.current = newScore
      setLastPoints(points)
      setOrderResult('correct')

      // Use regular-specific reaction if applicable
      if (currentRegularRef.current !== null) {
        setCorrectReaction(REGULARS[currentRegularRef.current].correctReaction)
      } else {
        setCorrectReaction(correctCycleRef.current.next())
      }

      // Track cup count and check for level up
      const newCupNumber = cupNumberRef.current + 1
      setCupNumber(newCupNumber)
      cupNumberRef.current = newCupNumber

      const prevLevel = levelRef.current
      const newLevel = getLevelForCup(newCupNumber)

      if (newLevel.level > prevLevel.level) {
        // Level up!
        setLevel(newLevel)
        levelRef.current = newLevel
        setLevelUpComment(pickRandom(CROWD_COMMENTS))

        // Grow the queue for the new level
        setQueueCustomers(prev => {
          const extra = newLevel.queueSize - prev.length
          if (extra > 0) {
            return [...prev, ...Array.from({ length: extra }, () => generateCustomerAppearance())]
          }
          return prev
        })

        setPhase('transition')
        setTimeout(() => {
          setPhase('levelup')
          setTimeout(() => {
            advanceToNextCustomer()
          }, LEVEL_TRANSITION_MS)
        }, TRANSITION_DURATION_MS)
      } else {
        setPhase('transition')
        setTimeout(() => {
          advanceToNextCustomer()
        }, TRANSITION_DURATION_MS)
      }
    } else {
      setOrderResult('wrong')
      setMismatches(getOrderMismatches(cup, currentOrder))
      // Use regular-specific reaction if applicable
      if (currentRegularRef.current !== null) {
        setExpletive(REGULARS[currentRegularRef.current].wrongReaction)
      } else {
        setExpletive(wrongCycleRef.current.next())
      }
      const newLives = livesRef.current - 1
      setLives(newLives)
      livesRef.current = newLives

      // Always show error panel — player must dismiss before gameover or next customer
      setCurrentQuote(quoteCycleRef.current.next())
      setPhase('errorAck')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentOrder, cup])

  // Determine the display text for the current order
  const orderDisplayText = (() => {
    if (!currentOrder) return ''
    if (isSecondVisit) return '' // hidden — they say "the usual"
    return currentOrder.displayName
  })()

  return {
    // State
    score,
    lives,
    phase,
    currentOrder,
    cup,
    orderResult,
    lastPoints,
    expletive,
    correctReaction,
    lessToggle,
    sugarLessToggle,
    condensedLessToggle,
    customer,
    queueCustomers,
    timer: {
      secondsRemaining: timer.secondsRemaining,
      isRunning: timer.isRunning,
    },

    // Level progression
    cupNumber,
    level,
    levelUpComment,

    // Session stats
    drinksServed: cupNumber,
    avgTime: cupNumber > 0 ? totalTimeUsedRef.current / cupNumber : 0,

    // Regular customer info
    isRegular,
    regularName,
    isSecondVisit,
    orderDisplayText,

    // Error explanation
    mismatches,
    currentQuote,

    // Actions
    startGame,
    addBase,
    toggleLess,
    setMilk,
    addSugar,
    toggleSugarLess,
    toggleCondensedLess,
    addIce,
    addHotWater,
    discardCup,
    acknowledgeError,
    serve,

    // Timer control (for pause/resume)
    pauseTimer: timer.pause,
    resumeTimer: timer.resume,
  }
}
