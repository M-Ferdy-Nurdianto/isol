import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaMinus } from 'react-icons/fa'

const FAQSection = ({ faqs, openFaq, setOpenFaq }) => {
  return (
    <section className="py-12 sm:py-16 md:py-24 container mx-auto max-w-3xl px-4 relative z-40">
      <div className="text-center mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-2 uppercase text-dark">Help Center</h2>
        <div className="w-20 h-1 bg-[#079108] mx-auto opacity-50"></div>
      </div>

      <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div 
              key={faq.id || idx} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }}
              className={`transition-all duration-300 border-2 border-[#079108]/20 hover:border-[#079108] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgba(7,145,8,0.1)] ${openFaq === idx ? 'border-[#079108] shadow-md' : ''}`}
            >
              <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full py-6 px-6 text-left flex items-center justify-between gap-6 group relative overflow-hidden">
                <span className={`text-base md:text-lg font-bold transition-colors ${openFaq === idx ? 'text-dark' : 'text-gray-500 group-hover:text-[#079108]'}`}>{faq.tanya}</span>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${openFaq === idx ? 'bg-[#079108] text-white rotate-180' : 'bg-gray-100 text-gray-400 group-hover:bg-[#079108]/10 group-hover:text-[#079108]'}`}>
                  {openFaq === idx ? <FaMinus size={10} /> : <FaPlus size={10} />}
                </div>
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                    <div className="px-6 pb-8 pt-2 text-gray-500 text-sm md:text-base font-medium leading-relaxed pl-8 md:pl-10">{faq.jawab}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
      </div>
    </section>
  )
}

export default FAQSection
