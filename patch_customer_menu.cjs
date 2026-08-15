const fs = require('fs');
const file = '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/pages/customer/CustomerMenu.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove all white overlays
content = content.replace(/<div className="absolute inset-0 bg-white\/\d+ group-hover:bg-(transparent|white\/\d+) transition-colors( duration-\d+)?" \/>/g, '');
// Handle case where classname is slightly different
content = content.replace(/<div className="absolute inset-0 bg-white\/[\d\w\s-:/]+transition-colors( duration-\d+)?" \/>/g, '');


// 2. Fix Modal Image
const modalEmojiLogic = `{(() => {
                      const hasPlus = item.emoji?.includes('+');
                      const parts = hasPlus ? item.emoji.split('+').map(p => p.trim()) : [item.emoji];
                      return (
                        <div className="flex items-center gap-1.5 relative z-10">
                          <motion.span
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, y: [0, -8, 0] }}
                            transition={{ scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.4 } }}
                            className="text-8xl sm:text-9xl drop-shadow-md"
                          >
                            {parts[0]}
                          </motion.span>
                          {hasPlus && (
                            <>
                              <span className="text-4xl text-amber-600 font-extrabold">+</span>
                              <motion.span
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1, y: [0, -8, 0] }}
                                transition={{ scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.6 } }}
                                className="text-8xl sm:text-9xl drop-shadow-md"
                              >
                                {parts[1]}
                              </motion.span>
                            </>
                          )}
                        </div>
                      );
                    })()}`;

const modalImageLogic = `
                    {item.image_url ? (
                      <motion.img 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover absolute inset-0 z-0"
                      />
                    ) : (
                      (() => {
                        const hasPlus = item.emoji?.includes('+');
                        const parts = hasPlus ? item.emoji.split('+').map(p => p.trim()) : [item.emoji];
                        return (
                          <div className="flex items-center gap-1.5 relative z-10">
                            <motion.span
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1, y: [0, -8, 0] }}
                              transition={{ scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.4 } }}
                              className="text-8xl sm:text-9xl drop-shadow-md"
                            >
                              {parts[0]}
                            </motion.span>
                            {hasPlus && (
                              <>
                                <span className="text-4xl text-amber-600 font-extrabold">+</span>
                                <motion.span
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1, y: [0, -8, 0] }}
                                  transition={{ scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.6 } }}
                                  className="text-8xl sm:text-9xl drop-shadow-md"
                                >
                                  {parts[1]}
                                </motion.span>
                              </>
                            )}
                          </div>
                        );
                      })()
                    )}
`;

content = content.replace(modalEmojiLogic, modalImageLogic);

fs.writeFileSync(file, content);
console.log('CustomerMenu patched for Image displays!');
