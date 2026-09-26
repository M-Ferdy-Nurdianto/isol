import { motion } from 'framer-motion'
import { FaUsers, FaInstagram, FaTwitter, FaYoutube, FaTiktok, FaStar, FaHeart, FaBolt, FaLeaf } from 'react-icons/fa'
import Header from '../components/Header'
import { getAssetPath } from '../lib/pathUtils'

const StoryPage = () => {
  return (
    <div className="min-h-screen bg-white text-dark overflow-x-hidden relative">
      <div className="noise-bg opacity-10"></div>
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={getAssetPath('/images/members/group.webp')} 
            alt="Kohi Sekai Group" 
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark/60 via-dark/40 to-white dark:to-[#090d16]"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center px-4"
        >
          <div className="inline-block px-4 py-2 bg-[#079108] rounded-full text-[10px] font-black tracking-[0.3em] text-white uppercase mb-6 shadow-xl">
             Since 2026
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white uppercase mb-4 drop-shadow-2xl">
            OUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-accent-yellow">STORY</span>
          </h1>
          <p className="text-white/80 font-bold max-w-2xl mx-auto tracking-widest uppercase text-xs md:text-sm">
            Official Journey & History Kohi Sekai
          </p>
        </motion.div>
      </section>

      {/* Philosophy Section */}
      <section className="py-10 md:py-16 container mx-auto max-w-7xl px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           <div className="space-y-8">
              <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-1 bg-[#079108]"></div>
                    <span className="text-[#079108] font-black tracking-[0.4em] text-xs uppercase">PHILOSOPHY</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight text-dark uppercase mb-6 leading-none">
                    LEBIH DARI <span className="text-[#079108]">SEKADAR</span> IDOLA
                  </h2>
              </div>
              <div className="space-y-6 text-gray-500 text-lg leading-relaxed font-light">
                <p>
                  <span className="text-dark font-bold">Kohi Sekai</span> lahir dengan semangat membawa pesona pertunjukan panggung yang dinamis, interaktif, dan penuh memori indah bagi semua penggemar.
                </p>
                <p>
                  Bagi kami, panggung bukan sekadar tempat menari dan menyanyi, melainkan jembatan untuk berbagi kebahagiaan dan energi positif secara langsung dengan Anda.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-8">
                 {[
                   { icon: <FaBolt />, title: 'ENERGY', desc: 'Semangat yang menular' },
                   { icon: <FaLeaf />, title: 'FRESH', desc: 'Konsep yang menyegarkan' },
                   { icon: <FaStar />, title: 'DREAM', desc: 'Mengejar mimpi bersama' },
                   { icon: <FaHeart />, title: 'LOVE', desc: 'Ketulusan dalam berkarya' }
                 ].map((item, idx) => (
                   <div key={idx} className="space-y-2">
                      <div className="w-12 h-12 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl flex items-center justify-center text-gray-400 dark:text-white/40 text-xl">
                        {item.icon}
                      </div>
                      <h4 className="font-black text-xs uppercase tracking-widest text-dark dark:text-white">{item.title}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{item.desc}</p>
                   </div>
                 ))}
              </div>
           </div>

           <div className="relative">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent-yellow/20 rounded-full blur-3xl opacity-50"></div>
              <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white group">
                <img 
                  src={getAssetPath('/images/members/group.webp')} 
                  alt="Philosophy Visual" 
                  className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
           </div>
        </div>
      </section>

      {/* Simple Timeline / Journey */}
      <section className="py-24 bg-gray-50/50">
        <div className="container mx-auto max-w-5xl px-4">
           <div className="text-center mb-16">
              <h3 className="text-3xl font-black text-dark uppercase tracking-widest mb-4">MILESTONES</h3>
              <div className="w-20 h-1.5 bg-[#079108] mx-auto rounded-full"></div>
           </div>

           <div className="space-y-12">
              {[
                { year: '2023', title: 'The Beginning', desc: 'Kohi Sekai resmi terbentuk dan memulai perjalanan karya perdananya.' },
                { year: '2024', title: 'Expansion', desc: 'Memperluas penampilan panggung dan merangkul komunitas penggemar lebih luas.' },
                { year: '2025', title: 'Solidifying Roots', desc: 'Memperkuat dominasi di skena Jawa Timur, menambah jam terbang panggung, dan mulai merancang karya orisinal pertama.' },
                { 
                  year: '2026', 
                  title: 'THE FUTURE IS NOW', 
                  desc: 'Something BIG is brewing. Sebuah rahasia besar sedang disiapkan... Siapkah Anda untuk evolusi Kohi Sekai yang sesungguhnya?',
                  isTeaser: true 
                }
              ].map((m, i, arr) => (
                <div key={i} className="flex gap-8 group">
                   <div className="flex flex-col items-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-xs z-10 shadow-lg group-hover:scale-110 transition-transform ${m.isTeaser ? 'bg-gradient-to-br from-purple-600 to-indigo-600 animate-pulse' : 'bg-[#079108]'}`}>
                        {m.year}
                      </div>
                      {i !== arr.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-4"></div>}
                   </div>
                   <div className="flex-1 pb-12">
                      <h4 className={`text-2xl font-black uppercase mb-2 group-hover:text-[#079108] transition-colors ${m.isTeaser ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 italic' : 'text-dark'}`}>
                        {m.title}
                      </h4>
                      <p className={`font-light leading-relaxed ${m.isTeaser ? 'text-indigo-400 font-bold' : 'text-gray-500'}`}>
                        {m.desc}
                      </p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 container mx-auto max-w-4xl px-4 text-center">
         <div className="bg-dark rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#079108] blur-[150px] opacity-20"></div>
            <div className="relative z-10 space-y-8">
               <h3 className="text-3xl md:text-5xl font-black tracking-tight leading-none uppercase">
                 JADILAH BAGIAN DARI <br/> <span className="text-[#079108]">KISAH KAMI</span>
               </h3>
               <p className="text-white/60 font-medium text-lg">
                 Ikuti kegiatan kami lebih dekat lewat media sosial dan jangan lewatkan penampilan kami berikutnya!
               </p>
               <div className="flex flex-wrap justify-center gap-6">
                  {[
                    { icon: <FaInstagram />, href: 'https://instagram.com/kohisekai' },
                    { icon: <FaTwitter />, href: 'https://twitter.com/kohi_sekai' },
                    { icon: <FaYoutube />, href: 'https://youtube.com/@KohiSekai' },
                    { icon: <FaTiktok />, href: 'https://tiktok.com/@kohisekai' },
                  ].map((social, idx) => (
                    <motion.a
                      key={idx}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ y: -5, scale: 1.1 }}
                      className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-2xl text-white hover:text-white hover:bg-[#079108] transition-all shadow-sm"
                    >
                      {social.icon}
                    </motion.a>
                  ))}
               </div>
            </div>
         </div>
      </section>

    </div>
  )
}

export default StoryPage
