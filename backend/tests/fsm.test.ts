import { SignalFSM } from '../src/engine/signalFSM';

// Mock the DB call so tests don't need a running database
jest.mock('../src/models/signal.model', () => ({
    SignalModel: {
        updateState: jest.fn().mockResolvedValue(undefined),
    },
}));

describe('SignalFSM', () => {
    describe('Initial state', () => {
        it('starts in RED state', () => {
            const fsm = new SignalFSM(1, 'Test', 30, 30, 5);
            expect(fsm.getState()).toBe('RED');
        });

        it('timer equals redDuration on init', () => {
            const fsm = new SignalFSM(1, 'Test', 30, 20, 5);
            expect(fsm.getTimeRemaining()).toBe(20);
        });
    });

    describe('State transitions', () => {
        it('transitions RED → GREEN when timer expires', () => {
            const fsm = new SignalFSM(1, 'Test', 30, 3, 5);
            fsm.tick(); fsm.tick(); fsm.tick(); // exhaust red timer (3)
            expect(fsm.getState()).toBe('GREEN');
        });

        it('transitions GREEN → YELLOW when timer expires', () => {
            const fsm = new SignalFSM(1, 'Test', 2, 1, 5);
            fsm.tick(); // RED expires → GREEN
            fsm.tick(); fsm.tick(); // GREEN expires (2) → YELLOW
            expect(fsm.getState()).toBe('YELLOW');
        });

        it('transitions YELLOW → RED when timer expires', () => {
            const fsm = new SignalFSM(1, 'Test', 2, 1, 2);
            fsm.tick();              // RED(1) → GREEN
            fsm.tick(); fsm.tick(); // GREEN(2) → YELLOW
            fsm.tick(); fsm.tick(); // YELLOW(2) → RED
            expect(fsm.getState()).toBe('RED');
        });

        it('completes full RED → GREEN → YELLOW → RED cycle', () => {
            const fsm = new SignalFSM(1, 'Test', 2, 1, 1);
            expect(fsm.getState()).toBe('RED');
            fsm.tick();              // RED(1) expires → GREEN
            expect(fsm.getState()).toBe('GREEN');
            fsm.tick(); fsm.tick(); // GREEN(2) expires → YELLOW
            expect(fsm.getState()).toBe('YELLOW');
            fsm.tick();              // YELLOW(1) expires → RED
            expect(fsm.getState()).toBe('RED');
        });
    });

    describe('Timer behaviour', () => {
        it('decrements timer by 1 each tick', () => {
            const fsm = new SignalFSM(1, 'Test', 30, 10, 5);
            fsm.tick();
            expect(fsm.getTimeRemaining()).toBe(9);
            fsm.tick();
            expect(fsm.getTimeRemaining()).toBe(8);
        });

        it('resets timer to greenDuration after RED expires', () => {
            const fsm = new SignalFSM(1, 'Test', 25, 1, 5);
            fsm.tick(); // RED expires → GREEN, timer = 25
            expect(fsm.getTimeRemaining()).toBe(25);
        });

        it('resets timer to yellowDuration after GREEN expires', () => {
            const fsm = new SignalFSM(1, 'Test', 1, 1, 7);
            fsm.tick(); // RED → GREEN
            fsm.tick(); // GREEN → YELLOW, timer = 7
            expect(fsm.getTimeRemaining()).toBe(7);
        });
    });

    describe('reset()', () => {
        it('returns to RED with correct redDuration timer', () => {
            const fsm = new SignalFSM(1, 'Test', 30, 15, 5);
            fsm.tick(); // advance to GREEN
            fsm.reset();
            expect(fsm.getState()).toBe('RED');
            expect(fsm.getTimeRemaining()).toBe(15);
        });
    });

    describe('Multiple instances are independent', () => {
        it('two FSMs do not share state', () => {
            const fsm1 = new SignalFSM(1, 'A', 30, 1, 5);
            const fsm2 = new SignalFSM(2, 'B', 30, 5, 5);
            fsm1.tick(); // fsm1: RED → GREEN
            expect(fsm1.getState()).toBe('GREEN');
            expect(fsm2.getState()).toBe('RED');
        });
    });
});
