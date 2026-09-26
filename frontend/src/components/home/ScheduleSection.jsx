import { motion } from 'framer-motion'
import { FaMapMarkerAlt, FaClock, FaArrowRight, FaStar } from 'react-icons/fa'

const ScheduleSection = ({ events, navigate }) => {
  return (
    <section className="py-20 md:py-32 bg-white relative overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 sm:mb-20 gap-6 md:gap-8 text-center md:text-left">
              <div className="w-full">
                   <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                      <div className="w-8 h-1 bg-[#079108]"></div>
                      <span className="text-[#079108] font-black tracking-[0.4em] text-xs uppercase">SCHEDULE</span>
                   </div>
                   <h2 className="text-4xl md:text-6xl font-black text-dark tracking-tighter uppercase mb-4">
                      Upcoming <span className="text-[#079108]">Events</span>
                   </h2>
                   <p className="text-gray-400 font-medium max-w-lg mx-auto md:mx-0">Jangan lewatkan penampilan seru kami di event terdekat!</p>
              </div>
              <button onClick={() => navigate('/schedule')} className="w-full md:w-auto px-10 py-4 rounded-full border-2 border-gray-100 text-[#4A90B5] font-black text-xs uppercase tracking-widest hover:border-[#4A90B5] hover:bg-[#4A90B5]/5 transition-all">
                  View Full Schedule
              </button>
          </div>

          {events.length > 0 ? (
              <div className="grid gap-8">
                  {events.map((event, idx) => {
                      const isSpecial = event.is_special || event.nama.toLowerCase().includes('valentine');
                      const themeColor = isSpecial ? (event.theme_color || '#FF6B9D') : '#079108';
                      return (
                          <motion.div 
                              key={event.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                              className={`p-5 sm:p-6 rounded-[2rem] md:rounded-[3rem] flex flex-col md:flex-row items-center gap-6 sm:gap-8 hover:shadow-xl transition-all group bg-white dark:bg-[#111726]/80 border-2 cursor-pointer ${isSpecial ? 'border-theme/20 dark:border-white/10' : 'border-gray-50 dark:border-white/10'}`}
                              style={{ borderColor: isSpecial ? `${themeColor}33` : undefined }}
                              onClick={() => navigate('/schedule')}
                          >
                              <div className="text-white w-20 h-20 sm:w-28 sm:h-28 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0" style={{ backgroundColor: themeColor }}>
                                <span className="block text-2xl sm:text-4xl font-black leading-none">{event.tanggal}</span>
                                <span className="block text-[8px] sm:text-xs font-black tracking-widest uppercase mt-1">{event.bulan}</span>
                              </div>
                              <div className="flex-1 space-y-3 text-center md:text-left min-w-0">
                                <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-dark dark:text-white tracking-tight truncate max-w-full">{event.nama}</h3>
                                  {isSpecial && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-[8px] font-black uppercase tracking-widest shadow-sm" style={{ backgroundColor: themeColor }}>
                                      <FaStar size={9} /> SPECIAL
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 sm:gap-6 text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                                  <div className="flex items-center gap-2"><FaMapMarkerAlt style={{ color: themeColor }} /><span>{event.lokasi}</span></div>
                                  {event.event_time && <div className="flex items-center gap-2"><FaClock style={{ color: themeColor }} /><span>{event.event_time}</span></div>}
                                </div>
                              </div>
                              <div className="hidden md:flex w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-50 items-center justify-center text-gray-300 group-hover:text-white group-hover:bg-theme group-hover:rotate-45 transition-all shadow-inner group-hover:shadow-lg">
                                  <FaArrowRight size={20} className="group-hover:text-white" />
                              </div>
                              <style dangerouslySetInnerHTML={{ __html: `.group:hover .group-hover\\:bg-theme { background-color: ${themeColor} !important; }`}} />
                          </motion.div>
                      );
                  })}
              </div>
          ) : (
              <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                  <p className="text-gray-400 font-black tracking-widest uppercase opacity-50">No upcoming events scheduled</p>
              </div>
          )}
      </div>
    </section>
  )
}

export default ScheduleSection
