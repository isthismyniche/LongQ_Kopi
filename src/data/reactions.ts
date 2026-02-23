// 50 wrong-order reactions — Singlish hawker culture exclamations
export const WRONG_REACTIONS: string[] = [
  'Wah lau eh!',
  'Aiyah!',
  'Siao ah!',
  'Alamak!',
  'Haiyah!',
  'Wrong one lah!',
  'Eh, this not what I order!',
  'You blur like sotong!',
  'Aiyo, pay attention lah!',
  'Huh?! Wrong drink sia!',
  'Walao, I say already!',
  'Cannot like that lah!',
  'Simi sai is this?!',
  'You deaf ah?!',
  'I order what, you give what?!',
  'Wah piang!',
  'Die lah, wrong drink!',
  'Jialat!',
  'Terrible sia!',
  'How can like that!',
  'I want refund!',
  'Boss, this wrong leh!',
  'Aiya, never listen!',
  'You kidding me ah?!',
  'So hard to make meh?!',
  'Tsk, try again lah!',
  'Not this one leh!',
  'My grandmother can do better!',
  'Where got like that one!',
  'Bodoh!',
  'Macam wrong order only!',
  'Eh hello, I say Kopi leh!',
  'This one taste wrong lah!',
  'You new here ah?',
  'Steady lah, wrong drink again!',
  'Cannot make it sia!',
  'Go back to school lah!',
  'Wah, like that also wrong!',
  'Rubbish lah this!',
  'You think I order this ah?',
  'Oi, not like that!',
  'Cheh!',
  'Dey, this is wrong!',
  'Buay tahan!',
  'What is this sia?!',
  'Bro, you okay not?',
  'Pengsan already!',
  'Give me patience lah!',
  'Try harder lah!',
  'Mampus!',
]

// 50 correct-order reactions — happy/grateful Singlish
export const CORRECT_REACTIONS: string[] = [
  'Shiok ah!',
  'Steady lah!',
  'Wah, power!',
  'Terima kasih!',
  'Xie xie ah!',
  'Nandri!',
  'Thank you boss!',
  'Fuiyoh!',
  'Gao dim!',
  'Perfect lah!',
  'Best sia!',
  'Very the good!',
  'Swee lah!',
  'Wah, pro sia!',
  'You da best lah!',
  'Correct correct!',
  'Yes! This one!',
  'Exactly what I want!',
  'Wah, kopi sifu power!',
  'Legend sia!',
  'Champion!',
  'Like that can already!',
  'Huat ah!',
  'Ong ah!',
  'Wah, damn fast!',
  'Nice nice nice!',
  'So good!',
  'Ok can!',
  'Thumbs up!',
  'Boleh!',
  'Sedap!',
  'Ho lim!',
  'Bagus!',
  'Cannot complain!',
  'Top notch!',
  'Solid lah!',
  'First class!',
  'A+ order sia!',
  'Mmm, just right!',
  'You know your stuff!',
  'Eh, young talent sia!',
  'Terbaik!',
  'Peng san — I mean, perfect!',
  'Like pro already!',
  'Kampung taste!',
  'Damn shiok!',
  'You got the touch!',
  'Steady pom pi pi!',
  'Lagi best!',
  'Come I give you tip!',
]

/**
 * ShuffleCycle: cycles through a list without repeating until all items
 * are exhausted, then reshuffles and starts again.
 */
export class ShuffleCycle<T> {
  private items: T[]
  private shuffled: T[] = []
  private index = 0

  constructor(items: T[]) {
    this.items = [...items]
    this.reshuffle()
  }

  private reshuffle() {
    this.shuffled = [...this.items]
    // Fisher-Yates shuffle
    for (let i = this.shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.shuffled[i], this.shuffled[j]] = [this.shuffled[j], this.shuffled[i]]
    }
    this.index = 0
  }

  next(): T {
    if (this.index >= this.shuffled.length) {
      this.reshuffle()
    }
    return this.shuffled[this.index++]
  }

  reset() {
    this.reshuffle()
  }
}
