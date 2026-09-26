import { motion } from 'framer-motion'
import { FaMusic } from 'react-icons/fa'

const FeaturedMusic = () => {
  return (
    <section className="relative w-full max-w-6xl mx-auto mt-8 sm:mt-16 mb-12 sm:mb-24" style={{ perspective: '1000px' }}>
      
      <motion.div 
        initial={{ opacity: 0, rotateX: 10, y: 50 }}
        animate={{ opacity: 1, rotateX: 0, y: 0 }}
        transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        className="relative rounded-[2rem] sm:rounded-[3rem] p-0 sm:p-[2px] bg-gradient-to-b from-[#1DB954]/50 via-[#079108]/30 to-[#4A90B5]/50 shadow-[0_10px_30px_-5px_rgba(7,145,8,0.3)] group w-full overflow-hidden"
      >
        <div className="absolute inset-0 rounded-[2rem] sm:rounded-[3rem] bg-black/80 backdrop-blur-3xl overflow-hidden -z-10">
           {/* Animated soundwaves background */}
           <div className="absolute bottom-0 left-0 w-full h-2/3 opacity-10 flex items-end justify-between px-2 sm:px-10 gap-1 sm:gap-2">
              {[...Array(24)].map((_, i) => (
                 <motion.div 
                   key={i}
                   animate={{ height: ["10%", "100%", "10%"] }}
                   transition={{ repeat: Infinity, duration: 0.8 + Math.random() * 1.5, ease: "easeInOut" }}
                   className="w-full bg-gradient-to-t from-[#1DB954] to-transparent rounded-t-full"
                 ></motion.div>
              ))}
           </div>
        </div>

        <div className="relative z-10 bg-black/60 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.9rem] border border-white/10 p-3.5 sm:p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-12 w-full overflow-hidden">
            
            {/* Left Side: Info & Typography */}
            <div className="flex-1 text-center lg:text-left space-y-4 sm:space-y-6 md:space-y-8 relative z-10 w-full max-w-full overflow-hidden">
               <motion.div 
                 whileHover={{ scale: 1.05 }}
                 className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/50 text-[#1DB954] font-black text-[10px] md:text-sm uppercase shadow-[0_0_15px_rgba(29,185,84,0.2)] text-center mx-auto lg:mx-0"
               >
                  <span className="relative flex h-2 w-2 md:h-3 md:w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1DB954] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 md:h-3 md:w-3 bg-[#1DB954]"></span>
                  </span>
                  Now Streaming Everywhere
               </motion.div>

               <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-[#1DB954] leading-tight break-words">
                 THE FIRST <br/> BLOOM.
               </h2>
               
               <p className="text-gray-300 text-sm md:text-xl font-medium max-w-sm sm:max-w-lg mx-auto lg:mx-0 leading-relaxed opacity-90 px-2 sm:px-0">
                 Perjalanan baru telah dimulai. Dengarkan Debut Single pertama <span className="text-[#1DB954] font-bold">Kohi Sekai</span>, Jadilah bagian dari langkah awal kami!
               </p>
            </div>

            {/* Right Side: Massive Embed & Spinning Vinyl */}
            <div className="w-full lg:w-[450px] relative flex justify-center items-center mt-4 sm:mt-6 md:mt-0 px-0 sm:px-0">
               {/* Spinning Vinyl Record - Slides out on hover (Hidden on mobile) */}
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                 className="absolute -right-16 top-1/2 -translate-y-1/2 w-80 h-80 bg-[#0a0a0a] rounded-full border-[2px] border-gray-800 shadow-2xl items-center justify-center lg:group-hover:translate-x-24 transition-transform duration-700 ease-out z-0 hidden lg:flex"
                 style={{
                   background: "repeating-radial-gradient(#111 0, #111 4px, #000 5px, #000 6px)"
                 }}
               >
                  <div className="w-1/3 h-1/3 bg-gradient-to-br from-[#079108] to-[#4A90B5] rounded-full flex items-center justify-center relative shadow-inner">
                     <div className="w-4 h-4 bg-black rounded-full absolute border border-gray-700"></div>
                     <FaMusic className="text-black/30 text-2xl absolute -ml-8 -mt-8 rotate-12" />
                     <FaMusic className="text-black/30 text-xl absolute ml-8 mt-8 -rotate-12" />
                  </div>
               </motion.div>

               {/* Spotify Player Container */}
               <motion.div 
                 whileHover={{ scale: 1.02, rotateY: -2 }}
                 transition={{ type: "spring", stiffness: 300, damping: 20 }}
                 className="relative z-10 w-full bg-white/5 p-0 sm:p-4 rounded-2xl sm:rounded-3xl backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                 style={{ transformStyle: 'preserve-3d' }}
               >
                 <iframe 
                   data-testid="embed-iframe" 
                   style={{ borderRadius: '16px' }} 
                   src="https://open.spotify.com/embed/album/1vepdJVgDRoSnpLd0P7XH1?utm_source=generator&theme=0&si=657d1b5c1f8444ff" 
                   width="100%" 
                   height="352" 
                   frameBorder="0" 
                   allowFullScreen="" 
                   allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                   loading="lazy"
                   className="w-full relative z-10 block"
                 ></iframe>
               </motion.div>
            </div>
            
        </div>
      </motion.div>
    </section>
  )
}

export default FeaturedMusic
