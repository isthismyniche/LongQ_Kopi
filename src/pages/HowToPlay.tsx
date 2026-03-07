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
              Customers queue up and order traditional Singaporean kopi and teh drinks.
              Prepare each order correctly before time runs out!
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-display text-xl font-bold text-hawker-red mb-3">How to Make a Drink</h2>
            <div className="space-y-3 text-kopi-brown/80">

              <div>
                <p className="font-semibold text-kopi-brown mb-0.5">Base — Kopi or Teh</p>
                <p className="text-sm">Add the base using the dispenser. A few strength variants:</p>
                <ul className="text-sm mt-1 ml-3 space-y-0.5">
                  <li><strong>Po</strong> — half strength (use the Less toggle)</li>
                  <li><strong>Gau</strong> — double strength</li>
                  <li><strong>Di Lo</strong> — pure concentrate, triple strength — no water needed!</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-kopi-brown mb-0.5">Milk</p>
                <p className="text-sm">Condensed milk is the default. Two variants:</p>
                <ul className="text-sm mt-1 ml-3 space-y-0.5">
                  <li><strong>O</strong> — no milk</li>
                  <li><strong>C</strong> — evaporated milk instead</li>
                </ul>
                <p className="text-sm mt-1">
                  Regular Kopi/Teh with condensed milk is naturally sweet — no sugar needed.
                  But for <strong>C</strong> drinks, add sugar. Unless it's <strong>Kosong</strong> — then skip sugar entirely.
                </p>
              </div>

              <div>
                <p className="font-semibold text-kopi-brown mb-0.5">Hot Water</p>
                <p className="text-sm">Add hot water to all drinks — except <strong>Di Lo</strong>, which is pure concentrate and doesn't need diluting.</p>
              </div>

              <div>
                <p className="font-semibold text-kopi-brown mb-0.5">Peng — Iced</p>
                <p className="text-sm">If the order says Peng, add ice.</p>
              </div>

              <div>
                <p className="font-semibold text-kopi-brown mb-0.5">Dabao — Takeaway <span className="text-kopi-brown/40 font-normal">(Levels 3+)</span></p>
                <p className="text-sm">Some customers want takeaway. Switch to the bag container before making their drink.</p>
              </div>

            </div>
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
              <li><strong>First visit (Level 2):</strong> They order a drink normally. Remember what they ordered!</li>
              <li><strong>Second visit (Levels 3–4):</strong> They'll say <strong>"The usual, please!"</strong> — you need to recall
                their drink from memory. A <strong>"Remember me?"</strong> label will appear as a hint.</li>
              <li>Serving their usual correctly earns a special reaction!</li>
            </ul>
            <p className="text-kopi-brown/60 text-sm mt-2">
              Regulars: Mr Rajan, Makcik Siti, Uncle Lim
            </p>
          </div>

        </div>

        {/* Drink Reference Matrix — collapsed by default */}
        <div className="max-w-3xl mx-auto">
          <details className="bg-white rounded-2xl shadow-sm overflow-hidden group">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none
              font-display font-bold text-kopi-brown/70 hover:text-kopi-brown transition-colors list-none">
              <span>Drink Reference Table</span>
              <span className="text-xs font-normal font-sans text-kopi-brown/40 group-open:hidden">show</span>
              <span className="text-xs font-normal font-sans text-kopi-brown/40 hidden group-open:inline">hide</span>
            </summary>
            <div className="border-t border-kopi-brown/10">
              <div className="overflow-x-auto">
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
                        <td className="px-3 py-2 text-kopi-brown/70">
                          {drink.sugarOptional ? <span className="text-kopi-brown/40 italic">Optional</span> : drink.sugar}
                        </td>
                        <td className="px-3 py-2 text-kopi-brown/70">
                          {drink.milk === 'Condensed' && drink.milkUnits === 0.5 ? 'Condensed (½)' : drink.milk}
                        </td>
                        <td className="px-3 py-2 text-center text-kopi-brown/70">{drink.hotWater ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-center text-sm text-kopi-brown/50 px-4 py-2">
                Any drink can be ordered as "Peng" (iced) or "Dabao" (takeaway).
              </p>
            </div>
          </details>
        </div>

        {/* Changelog */}
        <div className="max-w-2xl mx-auto mt-6">
          <details className="bg-white rounded-2xl shadow-sm overflow-hidden group">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none
              font-display font-bold text-kopi-brown/70 hover:text-kopi-brown transition-colors list-none">
              <span>Changelog</span>
              <span className="text-xs font-normal font-sans text-kopi-brown/40 group-open:hidden">show</span>
              <span className="text-xs font-normal font-sans text-kopi-brown/40 hidden group-open:inline">hide</span>
            </summary>
            <div className="px-4 pb-4 border-t border-kopi-brown/10">
              <ul className="mt-3 space-y-3 text-sm text-kopi-brown/70">
                <li>
                  <span className="font-semibold text-kopi-brown">Feb 2026 — Condensed milk &amp; Siu Dai revision</span>
                  <p className="mt-0.5">
                    An earlier version of the game required players to add sugar when making kopi or teh with
                    condensed milk. This was revised: condensed milk is sweet on its own, so sugar is now
                    optional for all condensed milk drinks — any amount (or none) is accepted.
                    Separately, Siu Dai for condensed milk drinks now means a half pour of condensed milk
                    (use the Less toggle on the condensed milk button) rather than half sugar.
                  </p>
                </li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </PageWrapper>
  )
}
