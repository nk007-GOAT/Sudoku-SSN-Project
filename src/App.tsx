import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RefreshCcw, 
  Lightbulb, 
  Trash2, 
  Play, 
  Settings2, 
  ChevronLeft, 
  CheckCircle2, 
  Timer,
  AlertCircle
} from 'lucide-react';
import { 
  generatePuzzle, 
  solveSudoku, 
  isValid, 
  getHint, 
  SIZE, 
  Difficulty 
} from './engine';

type GameMode = 'SOLVE' | 'PLAY';

export default function App() {
  const [grid, setGrid] = useState<number[][]>(Array.from({ length: SIZE }, () => Array(SIZE).fill(0)));
  const [fixed, setFixed] = useState<boolean[][]>(Array.from({ length: SIZE }, () => Array(SIZE).fill(false)));
  const [solution, setSolution] = useState<number[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [mode, setMode] = useState<GameMode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [conflicts, setConflicts] = useState<[number, number][]>([]);
  const [isGameWon, setIsGameWon] = useState(false);
  const [hintCell, setHintCell] = useState<[number, number] | null>(null);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === 'PLAY' && !isPaused && !isGameWon) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mode, isPaused, isGameWon]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selected || isGameWon) return;
      const [r, c] = selected;
      
      if (e.key >= '1' && e.key <= '9') {
        handleKeyPress(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === '0' || e.key === 'Delete') {
        handleKeyPress(0);
      } else if (e.key === 'ArrowUp') {
        setSelected([Math.max(0, r - 1), c]);
      } else if (e.key === 'ArrowDown') {
        setSelected([Math.min(SIZE - 1, r + 1), c]);
      } else if (e.key === 'ArrowLeft') {
        setSelected([r, Math.max(0, c - 1)]);
      } else if (e.key === 'ArrowRight') {
        setSelected([r, Math.min(SIZE - 1, c + 1)]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, isGameWon, grid]);

  const startNewGame = useCallback((diff: Difficulty) => {
    const puzzle = generatePuzzle(diff);
    setGrid(puzzle.grid);
    setFixed(puzzle.fixed);
    setSolution(puzzle.solution);
    setTimer(0);
    setMode('PLAY');
    setIsGameWon(false);
    setSelected(null);
    setConflicts([]);
    setHintCell(null);
  }, []);

  const handleCellClick = (r: number, c: number) => {
    if (isGameWon) return;
    setSelected([r, c]);
    setHintCell(null);
  };

  const handleKeyPress = (val: number) => {
    if (!selected || isGameWon) return;
    const [r, c] = selected;
    if (fixed[r][c]) return;

    const newGrid = grid.map(row => [...row]);
    
    if (val === 0) {
      newGrid[r][c] = 0;
    } else {
      newGrid[r][c] = val;
    }

    // Check for conflicts
    const newConflicts: [number, number][] = [];
    if (val !== 0) {
      const tempGrid = newGrid.map(row => [...row]);
      tempGrid[r][c] = 0; // Temporarily clear to check validity
      if (!isValid(tempGrid, r, c, val)) {
        newConflicts.push([r, c]);
      }
    }
    setConflicts(newConflicts);
    setGrid(newGrid);

    // Check win condition in PLAY mode
    if (mode === 'PLAY') {
      const isComplete = newGrid.every((row, ri) => 
        row.every((cell, ci) => cell === solution[ri][ci])
      );
      if (isComplete) setIsGameWon(true);
    }
  };

  const autoSolve = () => {
    const newGrid = grid.map(row => [...row]);
    if (solveSudoku(newGrid)) {
      setGrid(newGrid);
      setConflicts([]);
    } else {
      alert("No solution exists for this input!");
    }
  };

  const provideHint = () => {
    if (!solution.length && mode === 'SOLVE') {
      const temp = grid.map(row => [...row]);
      if (solveSudoku(temp)) {
        setSolution(temp);
      } else {
        alert("Enter a solvable puzzle first!");
        return;
      }
    }
    
    if (solution.length) {
      const hint = getHint(grid, solution);
      if (hint) {
        const newGrid = grid.map(row => [...row]);
        newGrid[hint.row][hint.col] = hint.val;
        setGrid(newGrid);
        setHintCell([hint.row, hint.col]);
        setSelected([hint.row, hint.col]);
      }
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!mode) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-200"
        >
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sudoku Nexus</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1 font-semibold">Academic Project Demo</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => {
                setMode('SOLVE');
                setGrid(Array.from({ length: SIZE }, () => Array(SIZE).fill(0)));
                setFixed(Array.from({ length: SIZE }, () => Array(SIZE).fill(false)));
              }}
              className="w-full flex items-center justify-between p-5 bg-white border-2 border-slate-100 hover:border-blue-500 hover:bg-slate-50 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100">
                  <Settings2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-900 uppercase text-[10px] tracking-wider mb-1">System Mode</div>
                  <div className="font-bold text-slate-800">Auto Solver</div>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-slate-400 rotate-180" />
            </button>

            <button 
              onClick={() => {
                setMode('PLAY');
                startNewGame(difficulty);
              }}
              className="w-full flex items-center justify-between p-5 bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all group shadow-lg shadow-blue-200"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-blue-100 uppercase text-[10px] tracking-wider mb-1">Game Engine</div>
                  <div className="font-bold text-white">Play Mode</div>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-white/80 rotate-180" />
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4 text-center">Select Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                    difficulty === d 
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden font-sans text-slate-800">
      {/* Sidebar Controls */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col p-6 shadow-sm z-20">
        <div className="mb-8 flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl shadow-lg shadow-blue-100">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Sudoku Nexus</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">V 1.0 Demo</p>
          </div>
        </div>

        <div className="space-y-6 overflow-y-auto pr-1">
          {/* Mode Selection */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">System Mode</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setMode('PLAY')}
                className={`py-2 text-xs font-bold rounded-md transition-all ${mode === 'PLAY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Play Mode
              </button>
              <button 
                onClick={() => setMode('SOLVE')}
                className={`py-2 text-xs font-bold rounded-md transition-all ${mode === 'SOLVE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Solver
              </button>
            </div>
          </div>

          {/* Difficulty (Visible in Play Mode) */}
          {mode === 'PLAY' && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">Difficulty</label>
              <div className="space-y-2">
                {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => {
                      setDifficulty(d);
                      startNewGame(d);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-all border-2 ${
                      difficulty === d 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-slate-100 bg-slate-50 hover:border-blue-400'
                    }`}
                  >
                    <span className={`text-sm font-bold ${difficulty === d ? 'text-blue-700' : 'text-slate-600'}`}>{d}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                      d === 'Easy' ? 'bg-emerald-100 text-emerald-700' : 
                      d === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {d === 'Easy' ? '35 Clues' : d === 'Medium' ? '45 Clues' : '55 Clues'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Panel */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Elapsed Time</p>
                <p className="text-2xl font-mono tracking-tighter tabular-nums">{formatTime(timer)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Mistakes</p>
                <p className={`text-xl font-mono ${conflicts.length > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                  {conflicts.length}/3
                </p>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (grid.flat().filter(n => n !== 0).length / 81) * 100)}%` }}
                className="h-full bg-blue-500" 
              />
            </div>
            <p className="text-[9px] text-slate-400 mt-2 text-center uppercase font-bold tracking-wider">
              Completeness: {Math.floor((grid.flat().filter(n => n !== 0).length / 81) * 100)}%
            </p>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <button 
            onClick={() => mode === 'PLAY' ? startNewGame(difficulty) : setGrid(Array.from({ length: SIZE }, () => Array(SIZE).fill(0)))}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95 mb-3 flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            New Session
          </button>
          <button 
            onClick={() => setMode(null)}
            className="w-full border border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm"
          >
            Main Menu
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header / Stats Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-10 flex-shrink-0">
          <div className="flex items-center space-x-12">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></span>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Engine Online</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session ID:</span>
              <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">X72-BKT-9A</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
            >
              {isPaused ? 'Resume' : 'Pause Game'}
            </button>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
               <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">PRO ENGINE ACTIVE</span>
            </div>
          </div>
        </header>

        {/* Sudoku Grid Area */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <motion.div 
            layout
            className="bg-white p-8 rounded-[2.5rem] shadow-2xl ring-1 ring-slate-200 flex flex-col items-center relative"
          >
            {/* The Grid Container */}
            <div className="grid grid-cols-9 bg-slate-900 gap-px border-[3px] border-slate-900 shadow-inner rounded-sm overflow-hidden relative">
              {grid.map((row, r) => (
                row.map((cell, c) => {
                  const isSelected = selected?.[0] === r && selected?.[1] === c;
                  const isFixed = fixed[r][c];
                  const isConflict = conflicts.some(conf => conf[0] === r && conf[1] === c);
                  const isHint = hintCell?.[0] === r && hintCell?.[1] === c;
                  
                  // Visual markers for 3x3 blocks
                  const borderRight = (c + 1) % 3 === 0 && c !== 8;
                  const borderBottom = (r + 1) % 3 === 0 && r !== 8;

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      className={`
                        w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center cursor-pointer relative
                        transition-all duration-200
                        ${isSelected ? 'z-10' : ''}
                        ${borderRight ? 'mr-0.5' : ''}
                        ${borderBottom ? 'mb-0.5' : ''}
                        ${isSelected ? 'bg-blue-50' : isFixed ? 'bg-slate-100/80 shadow-inner' : 'bg-white hover:bg-slate-50'}
                        ${isConflict ? 'bg-rose-50' : ''}
                        ${isHint ? 'bg-emerald-50' : ''}
                      `}
                    >
                      <AnimatePresence mode="wait">
                        {cell !== 0 && !isPaused && (
                          <motion.span 
                            key={cell}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`
                              text-xl sm:text-2xl font-bold select-none tabular-nums tracking-tighter
                              ${isFixed ? 'text-slate-900' : 'text-blue-600'}
                              ${isConflict ? 'text-rose-600 font-black' : ''}
                              ${isHint ? 'text-emerald-600' : ''}
                            `}
                          >
                            {cell}
                          </motion.span>
                        )}
                        {isPaused && (
                            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                        )}
                      </AnimatePresence>
                      
                      {isSelected && (
                        <motion.div 
                          layoutId="cell-selector"
                          className="absolute inset-0 ring-4 ring-blue-400 ring-inset z-10 pointer-events-none" 
                        />
                      )}
                    </div>
                  );
                })
              ))}
            </div>

            {/* In-game Win Modal overlay */}
            <AnimatePresence>
              {isGameWon && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-blue-600/95 backdrop-blur-md rounded-[2.5rem] z-50 flex flex-col items-center justify-center p-8 text-center text-white"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                    className="bg-white/20 p-6 rounded-full mb-6"
                  >
                    <Trophy className="w-20 h-20 text-white" />
                  </motion.div>
                  <h2 className="text-4xl font-black mb-2 tracking-tighter">PERFECT SCORE</h2>
                  <p className="text-blue-100 mb-8 font-bold tracking-widest text-xs uppercase underline underline-offset-8">
                    {difficulty} Puzzle Complete • {formatTime(timer)}
                  </p>
                  <button 
                    onClick={() => startNewGame(difficulty)}
                    className="px-10 py-5 bg-white text-blue-600 font-black rounded-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-2xl"
                  >
                    NEXT SESSION <RefreshCcw className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Footer Controls */}
        <footer className="h-24 bg-white border-t border-slate-200 p-6 flex flex-shrink-0 items-center justify-between px-10">
          <div className="flex space-x-12">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Validation Engine</span>
              <span className="text-xs font-bold text-slate-700 flex items-center">
                 <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${conflicts.length === 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {conflicts.length === 0 ? <CheckCircle2 className="w-3 h-3 text-white" /> : <AlertCircle className="w-3 h-3 text-white" />}
                 </div>
                 Grid Consistency: {conflicts.length === 0 ? 'Optimal' : 'Conflicted'}
              </span>
            </div>
            <div className="flex flex-col max-w-[300px]">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Intelligent Hint System</span>
              <span className="text-xs italic text-slate-500 font-medium leading-tight">
                {hintCell ? `Pruning complete. Cell (${hintCell[0]+1}, ${hintCell[1]+1}) assigned validated value.` : "Engine standby. Select a cell and request assist if stuck."}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex p-1 bg-slate-100 rounded-xl mr-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                        key={num}
                        onClick={() => handleKeyPress(num)}
                        className="w-10 h-10 flex items-center justify-center font-black text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-lg transition-all text-sm"
                    >
                        {num}
                    </button>
                ))}
                <button 
                    onClick={() => handleKeyPress(0)}
                    className="w-10 h-10 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
            <button 
                onClick={provideHint}
                className="px-6 py-2.5 border-2 border-slate-900 text-slate-900 font-black rounded-xl hover:bg-slate-900 hover:text-white transition-all text-xs tracking-widest uppercase hover:scale-105 active:scale-95"
            >
                Get Hint
            </button>
            <button 
                onClick={mode === 'SOLVE' ? autoSolve : () => {}}
                className={`px-6 py-2.5 font-black rounded-xl shadow-lg transition-all text-xs tracking-widest uppercase hover:scale-105 active:scale-95 ${
                    mode === 'SOLVE' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
            >
                Auto Solve
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
