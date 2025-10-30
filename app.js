const { useState, useEffect } = React;

const storage = {
  get: (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch { return null; }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }
};

const App = () => {
  const [completed, setCompleted] = useState({});
  const [progress, setProgress] = useState({});
  const [logs, setLogs] = useState({});
  const [streak, setStreak] = useState(0);
  const [expanded, setExpanded] = useState({ 1: true });
  const [editingBook, setEditingBook] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarOffset, setCalendarOffset] = useState(0);

  useEffect(() => {
    setCompleted(storage.get('books') || {});
    setProgress(storage.get('progress') || {});
    setLogs(storage.get('logs') || {});
    setStreak(storage.get('streak') || 0);
  }, []);

  const save = (books, prog, dailyLogs, str) => {
    storage.set('books', books);
    storage.set('progress', prog);
    storage.set('logs', dailyLogs);
    storage.set('streak', str);
  };

  const toggle = (id) => {
    const newCompleted = { ...completed, [id]: !completed[id] };
    setCompleted(newCompleted);
    save(newCompleted, progress, logs, streak);
  };

  const updateProgress = (id, pages) => {
    const newProgress = { ...progress, [id]: pages };
    setProgress(newProgress);
    save(completed, newProgress, logs, streak);
  };

  const logDay = () => {
    const today = new Date().toISOString().split('T')[0];
    const newLogs = { ...logs, [today]: true };
    let newStreak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (newLogs[d.toISOString().split('T')[0]]) newStreak++;
      else break;
    }
    setLogs(newLogs);
    setStreak(newStreak);
    save(completed, progress, newLogs, newStreak);
  };

  const getCalendarDays = () => {
    const days = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - calendarOffset);
    startDate.setDate(startDate.getDate() - 29);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      
      days.push({
        date: dateStr,
        dayOfMonth: date.getDate(),
        month: date.getMonth(),
        isLogged: logs[dateStr] || false,
        isToday: dateStr === todayStr,
        isFuture: date > today
      });
    }
    return days;
  };

  const getMonthName = (monthIndex) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex];
  };

  const getCalendarTitle = () => {
    if (calendarOffset === 0) return 'Last 30 Days';
    const today = new Date();
    const offsetDate = new Date(today);
    offsetDate.setMonth(offsetDate.getMonth() - calendarOffset);
    return `${getMonthName(offsetDate.getMonth())} ${offsetDate.getFullYear()}`;
  };

  const getFilteredData = () => {
    if (!searchQuery.trim()) return window.readingData;
    
    const query = searchQuery.toLowerCase();
    return window.readingData.map(phase => ({
      ...phase,
      months: phase.months.map(month => ({
        ...month,
        books: month.books.filter(book =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.summary?.toLowerCase().includes(query)
        )
      })).filter(month => month.books.length > 0)
    })).filter(phase => phase.months.length > 0);
  };

  const getCurrentReading = () => {
    for (let phase of window.readingData) {
      for (let month of phase.months) {
        const currentBook = month.books.find(book => !completed[book.id]);
        if (currentBook) {
          return { month, phase: phase.phase, book: currentBook };
        }
      }
    }
    return null;
  };

  const data = getFilteredData();
  const total = window.readingData.reduce((s, p) => s + p.months.reduce((m, mo) => m + mo.books.length, 0), 0);
  const done = Object.values(completed).filter(Boolean).length;
  const today = new Date().toISOString().split('T')[0];
  const currentReading = getCurrentReading();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-amber-50 to-orange-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          {window.Icons.BookOpen()} 30-Theme Reading Habit Builder
        </h1>
        <p className="text-gray-600 mb-6">{total} books • 2.5-year journey</p>
        
        {currentReading && (
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              {window.Icons.BookOpen()}
              <span className="font-bold text-blue-900">Currently Reading</span>
            </div>
            <div>
              <div className="text-base font-semibold text-blue-900">
                📖 {currentReading.book.title}
              </div>
              <div className="text-sm text-blue-700 mb-1">
                by {currentReading.book.author}
              </div>
            </div>
            <div className="text-sm text-blue-800">
              <span className="font-semibold">Theme {currentReading.month.num}:</span> {currentReading.month.title}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {currentReading.phase}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <label className="font-semibold text-gray-700 mb-2 block">Search Books:</label>
          <input
            type="text"
            placeholder="🔍 Search by title, author, or summary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-amber-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-800">{done}</div>
            <div className="text-sm text-amber-700">Books Completed</div>
          </div>
          <div className="bg-blue-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-800">{total}</div>
            <div className="text-sm text-blue-700">Total Books</div>
          </div>
          <div className="bg-green-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-800">{streak}</div>
            <div className="text-sm text-green-700">Day Streak</div>
            <button
              onClick={() => {
                setStreak(0);
                setLogs({});
                save(completed, progress, {}, 0);
              }}
              className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
            >
              Reset streak
            </button>
          </div>
          <div className="bg-purple-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-800">
              {Math.round((done/total)*100)}%
            </div>
            <div className="text-sm text-purple-700">Progress</div>
          </div>
        </div>

        <button
          onClick={logDay}
          disabled={logs[today]}
          className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
            logs[today] ? 'bg-green-600 text-white cursor-not-allowed' : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          {window.Icons.Calendar()}
          {logs[today] ? "✓ You've read today!" : "Log Today's Reading"}
        </button>

        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="w-full mt-2 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          {window.Icons.CalendarDays()}
          {showCalendar ? "Hide Calendar" : "Show Reading Calendar"}
        </button>

        {showCalendar && (
          <div className="mt-4 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCalendarOffset(calendarOffset + 1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {window.Icons.ChevronLeft()}
              </button>
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                {window.Icons.CalendarDays()}
                {getCalendarTitle()}
              </h3>
              <button
                onClick={() => setCalendarOffset(Math.max(0, calendarOffset - 1))}
                disabled={calendarOffset === 0}
                className={`p-2 rounded-lg transition-colors ${
                  calendarOffset === 0 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'
                }`}
              >
                {window.Icons.ChevronRight()}
              </button>
            </div>
            <div className="mb-3 flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Read</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-200 rounded"></div>
                <span>Missed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-400 rounded ring-2 ring-blue-600"></div>
                <span>Today</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-xs text-center font-semibold text-gray-600 pb-1">
                  {day}
                </div>
              ))}
              {getCalendarDays().map((day, idx) => {
                const isNewMonth = idx === 0 || day.dayOfMonth === 1;
                return (
                  <div key={day.date} className="relative">
                    {isNewMonth && (
                      <div className="absolute -top-5 left-0 text-xs font-semibold text-gray-500">
                        {getMonthName(day.month)}
                      </div>
                    )}
                    <div
                      className={`aspect-square rounded flex items-center justify-center text-xs font-medium ${
                        day.isFuture
                          ? 'bg-gray-100 text-gray-300'
                          : day.isToday
                          ? 'bg-blue-400 text-white ring-2 ring-blue-600'
                          : day.isLogged
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {day.dayOfMonth}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-xs text-gray-600 text-center">
              <strong>{Object.keys(logs).length}</strong> total reading days logged
            </div>
          </div>
        )}
      </div>

      {data.map((phase, i) => (
        <div key={i} className="mb-8">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-t-lg p-4">
            <h2 className="text-xl font-bold">{phase.phase}</h2>
            <p className="text-amber-100 text-sm">{phase.subtitle}</p>
          </div>
          {phase.phaseExplanation && (
            <div className="bg-amber-50 border-x border-amber-200 p-4">
              <p className="text-sm text-gray-700 leading-relaxed italic">
                {phase.phaseExplanation}
              </p>
            </div>
          )}
          
          {phase.months.map(month => {
            const isExpanded = expanded[month.num];
            const monthCompleted = month.books.every(book => completed[book.id]);
            const monthProgress = month.books.filter(book => completed[book.id]).length;
            const totalPages = month.books.reduce((sum, book) => sum + book.pages, 0);
            const readPages = month.books.reduce((sum, book) => {
              const prog = progress[book.id] || 0;
              return sum + prog;
            }, 0);
            
            return (
              <div key={month.num} className="bg-white border-x border-b border-gray-200">
                <button
                  onClick={() => setExpanded({...expanded, [month.num]: !expanded[month.num]})}
                  className="w-full p-4 text-left hover:bg-gray-50 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-lg text-gray-800">
                        Theme {month.num}
                      </span>
                      {monthCompleted && <span>{window.Icons.Award()}</span>}
                      <span className="text-gray-600">{month.title}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{month.dates}</div>
                    <div className="flex gap-4 mt-2 flex-wrap text-xs">
                      <span className="text-amber-600 font-semibold">
                        {monthProgress}/{month.books.length} books completed
                      </span>
                      <span className="text-blue-600">
                        📖 {totalPages.toLocaleString()} total pages
                      </span>
                      <span className="text-green-600">
                        ✓ {readPages.toLocaleString()} read
                      </span>
                    </div>
                  </div>
                  <span>{isExpanded ? window.Icons.ChevronUp() : window.Icons.ChevronDown()}</span>
                </button>

                {isExpanded && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    {month.description && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-700 leading-relaxed">
                        {month.description}
                      </div>
                    )}
                    {month.focus && (
                      <div className="mb-4 p-3 bg-amber-100 rounded-lg text-sm text-amber-800">
                        <strong>Focus:</strong> {month.focus}
                      </div>
                    )}
                    <div className="space-y-3">
                      {month.books.map(book => {
                        const currentProgress = progress[book.id] || 0;
                        const isCompleted = completed[book.id];
                        const isEditing = editingBook === book.id;
                        const progressPercent = Math.round((currentProgress / book.pages) * 100);

                        return (
                          <div
                            key={book.id}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              isCompleted ? 'bg-green-50 border-green-500' : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                onClick={() => toggle(book.id)}
                                className={`mt-1 flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer ${
                                  isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-amber-400'
                                }`}
                              >
                                {isCompleted && window.Icons.Check()}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-800">{book.title}</div>
                                <div className="text-sm text-gray-600">{book.author}</div>
                                {book.summary && (
                                  <div className="text-xs text-gray-500 mt-2 italic leading-relaxed">
                                    {book.summary}
                                  </div>
                                )}
                                <div className="flex gap-3 mt-2 flex-wrap items-center">
                                  <span className="text-xs text-gray-500">{book.pages} pages</span>
                                  {book.year && (
                                    <span className="text-xs text-gray-500">• {book.year}</span>
                                  )}
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    book.type === 'fiction'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {book.type === 'fiction' ? '📖 Fiction' : '📚 Non-Fiction'}
                                  </span>
                                </div>

                                {!isCompleted && (
                                  <div className="mt-3">
                                    {isEditing ? (
                                      <div className="flex gap-2 items-center">
                                        <input
                                          type="number"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          min="0"
                                          max={book.pages}
                                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                          placeholder="Pages"
                                          autoFocus
                                        />
                                        <span className="text-xs text-gray-500">/ {book.pages}</span>
                                        <button
                                          onClick={() => {
                                            const pages = parseInt(editValue) || 0;
                                            const validPages = Math.min(Math.max(0, pages), book.pages);
                                            updateProgress(book.id, validPages);
                                            if (validPages >= book.pages) {
                                              toggle(book.id);
                                            }
                                            setEditingBook(null);
                                            setEditValue('');
                                          }}
                                          className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                                        >
                                          {window.Icons.Save()}
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingBook(null);
                                            setEditValue('');
                                          }}
                                          className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-xs"
                                        >
                                          {window.Icons.X()}
                                        </button>
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div 
                                              className="bg-amber-600 h-2 rounded-full transition-all"
                                              style={{ width: `${progressPercent}%` }}
                                            />
                                          </div>
                                          <span className="text-xs font-semibold text-gray-700">
                                            {progressPercent}%
                                          </span>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                          <span className="text-xs text-gray-600">
                                            {currentProgress} of {book.pages} pages
                                          </span>
                                          <span className="text-xs text-orange-600">
                                            ({book.pages - currentProgress} left)
                                          </span>
                                          <button
                                            onClick={() => {
                                              setEditingBook(book.id);
                                              setEditValue(currentProgress.toString());
                                            }}
                                            className="ml-auto text-amber-600 hover:text-amber-700 p-1"
                                          >
                                            {window.Icons.Edit2()}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          {window.Icons.TrendingUp()}
          Your Reading Journey
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>🎯 <strong>Phase 1 (Themes 1-3):</strong> Build the habit - consistency over completion</p>
          <p>🧠 <strong>Phase 2 (Themes 4-9):</strong> Understanding self - sustainable pace</p>
          <p>💫 <strong>Phase 3 (Themes 10-15):</strong> Finding meaning - deeper engagement</p>
          <p>⚙️ <strong>Phase 4 (Themes 16-22):</strong> Building systems - strong reader now</p>
          <p>🏆 <strong>Phase 5 (Themes 23-30):</strong> Creating success - mastery level</p>
        </div>
        <div className="mt-4 p-4 bg-amber-50 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Remember:</strong> Book swaps are allowed! If a book isn't working, switch within the same theme. 
            Buffer weeks are built in for catch-up. This is a marathon, not a sprint.
          </p>
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);