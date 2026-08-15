const fs = require('fs');
const file = '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/pages/customer/CustomerMenu.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Inject state for touch
const touchStateStr = `
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchMove = (e) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    
    // Check if horizontal swipe is dominant to avoid triggering during scroll
    if (Math.abs(distanceX) > Math.abs(distanceY) * 1.5) {
      const filterTabs = ['all', 'offers', ...categories.map(c => c.id)];
      const currentIndex = filterTabs.indexOf(activeCategory);
      
      if (isLeftSwipe && currentIndex < filterTabs.length - 1) {
        setActiveCategory(filterTabs[currentIndex + 1]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (isRightSwipe && currentIndex > 0) {
        setActiveCategory(filterTabs[currentIndex - 1]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };
`;

if (!content.includes('const [touchStart')) {
    content = content.replace('const [visibleCount, setVisibleCount] = useState(12);', touchStateStr + '\n  const [visibleCount, setVisibleCount] = useState(12);');
}

// 2. Attach touch handlers to main container
const mainStart = '<main className="max-w-7xl mx-auto px-4 pb-32 mt-4 space-y-8 relative">';
const mainStartWithEvents = '<main className="max-w-7xl mx-auto px-4 pb-32 mt-4 space-y-8 relative" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEndEvent}>';

if (content.includes(mainStart)) {
    content = content.replace(mainStart, mainStartWithEvents);
}

fs.writeFileSync(file, content);
console.log('Swipe handlers added!');
