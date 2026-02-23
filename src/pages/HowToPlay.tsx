import PageWrapper from '../components/ui/PageWrapper'
import BackButton from '../components/ui/BackButton'
import { BASE_DRINKS } from '../data/drinkMatrix'

export default function HowToPlay() {
  return (
    <PageWrapper className="flex flex-col h-full bg-cream">
      <div className="p-4 flex-shrink-0">
        <BackButton />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <h1 className="font-display text-3xl font-bold text-kopi-brown mb-4 text-center">
          How to Play
        </h1>

        {/* Instructions */}
        <div className="max-w-2xl mx-auto space-y-4 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-display text-xl font-bold text-hawker-red mb-2">The Goal</h2>
            <p className="text-kopi-brown/80">
              You're a hawker stall attendant. Customers queue up and order traditional
              Singaporean kopi and teh drinks. Prepare each order correctly before time runs out!
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-display text-xl font-bold text-hawker-red mb-2">How to Make a Drink</h2>
            <ol className="list-decimal list-inside text-kopi-brown/80 space-y-1">
              <li>Read the customer's order in the speech bubble</li>
              <li>Add the correct <strong>base</strong> (Kopi or Teh) — click the dispenser. Use <strong>Less</strong> toggle for half-strength (Po) pours</li>
              <li>Add <strong>milk</strong> if needed (Condensed or Evaporated)</li>
              <li>Add <strong>sugar</strong> — click Sugar button. Use <strong>Less</strong> toggle beside it for half sugar (Siu Dai). No click = Kosong</li>
              <li>Add <strong>hot water</strong> — required for all drinks except Di Lo</li>
              <li>Add <strong>ice</strong> if the order says "Peng"</li>
              <li>Hit <strong>Serve</strong> when ready!</li>
            </ol>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-display text-xl font-bold text-hawker-red mb-2">Scoring</h2>
            <ul className="text-kopi-brown/80 space-y-1">
              <li><strong>Correct order:</strong> 5 points + bonus for time remaining</li>
              <li><strong>Wrong order or timeout:</strong> Lose 1 life</li>
              <li><strong>Game over:</strong> When all lives are lost (start with 2)</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-display text-xl font-bold text-hawker-red mb-2">Regular Customers</h2>
            <p className="text-kopi-brown/80 mb-2">
              Some customers are <strong>regulars</strong> who visit your stall more than once.
              You'll recognise them by their name badge and a floating <strong>"Remember me!"</strong> label.
            </p>
            <ul className="text-kopi-brown/80 space-y-1">
              <li><strong>First visit (Levels 2-3):</strong> They order a drink normally. Remember what they ordered!</li>
              <li><strong>Second visit (Levels 4-5):</strong> They'll say <strong>"The usual, please!"</strong> — you need to recall
                their drink from memory. A <strong>"Remember me?"</strong> label will appear as a hint.</li>
              <li>Serving their usual correctly earns a special reaction!</li>
            </ul>
            <p className="text-kopi-brown/60 text-sm mt-2">
              Regulars: Mr Rajan, Makcik Siti, Uncle Lim
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-display text-xl font-bold text-hawker-red mb-2">Special Terms</h2>
            <ul className="text-kopi-brown/80 space-y-1">
              <li><strong>Po</strong> — lighter, half-strength base (0.5 units)</li>
              <li><strong>Gau</strong> — extra strong (2 units of base)</li>
              <li><strong>Di Lo</strong> — extra extra strong (3 units of base, no hot water needed)</li>
              <li><strong>Siu Dai</strong> — less sweet (half sugar)</li>
              <li><strong>Kosong</strong> — no sugar</li>
              <li><strong>O</strong> — no milk</li>
              <li><strong>C</strong> — evaporated milk instead of condensed</li>
              <li><strong>Peng</strong> — iced</li>
            </ul>
          </div>
        </div>

        {/* Drink Reference Matrix */}
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-kopi-brown mb-3 text-center">
            Drink Reference
          </h2>
          <div className="overflow-x-auto rounded-2xl shadow-sm">
            <table className="w-full bg-white text-sm">
              <thead>
                <tr className="bg-kopi-brown text-white">
                  <th className="px-3 py-2 text-left font-display">Name</th>
                  <th className="px-3 py-2 text-left font-display">Base</th>
                  <th className="px-3 py-2 text-center font-display">Units</th>
                  <th className="px-3 py-2 text-left font-display">Sugar</th>
                  <th className="px-3 py-2 text-left font-display">Milk</th>
                  <th className="px-3 py-2 text-center font-display">Hot Water</th>
                </tr>
              </thead>
              <tbody>
                {BASE_DRINKS.map((drink, i) => (
                  <tr
                    key={drink.name}
                    className={i % 2 === 0 ? 'bg-cream/50' : 'bg-white'}
                  >
                    <td className="px-3 py-2 font-semibold text-kopi-brown">{drink.name}</td>
                    <td className="px-3 py-2 text-kopi-brown/70">{drink.base}</td>
                    <td className="px-3 py-2 text-center text-kopi-brown/70">{drink.baseUnits}</td>
                    <td className="px-3 py-2 text-kopi-brown/70">{drink.sugar}</td>
                    <td className="px-3 py-2 text-kopi-brown/70">{drink.milk}</td>
                    <td className="px-3 py-2 text-center text-kopi-brown/70">{drink.hotWater ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-sm text-kopi-brown/50 mt-2">
            Any drink can be ordered as "Peng" (iced). Add ice to the cup!
          </p>
        </div>
      </div>
    </PageWrapper>
  )
}
