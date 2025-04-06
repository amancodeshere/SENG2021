import { userInput, validateUser, updateUserSession, getSessionsByEmail, getUserBySessionId, invalidateSession } from '../../UsersToDB.js';
import { CustomInputError } from '../../errors.js';
import bcrypt from 'bcrypt';
import { db } from '../../connect.js';

jest.mock('../../connect.js');
jest.mock('bcrypt');

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

describe('userInput', () => {
    afterEach(() => jest.clearAllMocks());

    it('should return error if missing fields', (done) => {
        userInput('', 'pass', 'comp', (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            done();
        });
    });

    it('should handle bcrypt hash error', (done) => {
        bcrypt.hash.mockImplementation((p, r, cb) => cb(new Error('hash error')));
        userInput('email', 'pass', 'comp', (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            done();
        });
    });

    it('should handle db insert error', (done) => {
        bcrypt.hash.mockImplementation((p, r, cb) => cb(null, 'hashed'));
        db.query.mockRejectedValueOnce(new Error('insert error'));
        userInput('email', 'pass', 'comp', (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            done();
        });
    });

    it('should successfully insert user and create session', (done) => {
        bcrypt.hash.mockImplementation((p, r, cb) => cb(null, 'hashed'));
        db.query
            .mockResolvedValueOnce({ rows: [{ userid: 1 }] })
            .mockResolvedValueOnce({ rows: [{ sessionid: 2 }] });
        userInput('email', 'pass', 'comp', (err, res) => {
            expect(err).toBeNull();
            expect(res).toEqual({ success: true, message: 'User registered.', userID: 1, sessionID: 2 });
            done();
        });
    });
});

describe('validateUser', () => {
    afterEach(() => jest.clearAllMocks());

    it('should error on missing fields', (done) => {
        validateUser('', '', (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            done();
        });
    });

    it('should handle db error', (done) => {
        db.query.mockRejectedValue(new Error('db error'));
        validateUser('email', 'pass', (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            done();
        });
    });

    it('should return false for non-existing user', (done) => {
        db.query.mockResolvedValue({ rows: [] });
        validateUser('email', 'pass', (err, match) => {
            expect(err).toBeNull();
            expect(match).toBe(false);
            done();
        });
    });

    it('should handle bcrypt compare error', (done) => {
        db.query.mockResolvedValue({ rows: [{ password: 'hashed' }] });
        bcrypt.compare.mockImplementation((p, h, cb) => cb(new Error('compare error')));
        validateUser('email', 'pass', (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            done();
        });
    });

    it('should validate user successfully', (done) => {
        db.query.mockResolvedValue({ rows: [{ password: 'hashed' }] });
        bcrypt.compare.mockImplementation((p, h, cb) => cb(null, true));
        validateUser('email', 'pass', (err, match) => {
            expect(err).toBeNull();
            expect(match).toBe(true);
            done();
        });
    });
});

describe('updateUserSession', () => {
    afterEach(() => jest.clearAllMocks());

    it('should error if no email provided', (done) => {
        updateUserSession('', (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            done();
        });
    });

    it('should error if user not found', (done) => {
        db.query.mockResolvedValueOnce({ rows: [] });
        updateUserSession('email', (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            done();
        });
    });

    it('should error on session creation or login update failure', (done) => {
        db.query
            .mockResolvedValueOnce({ rows: [{ userid: 1 }] })
            .mockRejectedValueOnce(new Error('fail'));
        updateUserSession('email', (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            done();
        });
    });

    it('should succeed in creating session and updating login count', (done) => {
        db.query
            .mockResolvedValueOnce({ rows: [{ userid: 1 }] })
            .mockResolvedValueOnce({ rows: [{ sessionid: 2 }] })
            .mockResolvedValueOnce({});
        updateUserSession('email', (err, res) => {
            expect(err).toBeNull();
            expect(res).toEqual({ success: true, message: 'New session created.', userID: 1, sessionID: 2 });
            done();
        });
    });
});

describe('getSessionsByEmail', () => {
    afterEach(() => jest.clearAllMocks());

    it('should error if email not provided', (done) => {
        getSessionsByEmail('', (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            done();
        });
    });

    it('should error if user not found', (done) => {
        db.query.mockResolvedValueOnce({ rows: [] });
        getSessionsByEmail('email', (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            done();
        });
    });

    it('should error if no sessions found', (done) => {
        db.query
            .mockResolvedValueOnce({ rows: [{ userid: 1 }] })
            .mockResolvedValueOnce({ rows: [] });
        getSessionsByEmail('email', (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            done();
        });
    });

    it('should succeed in returning session data', (done) => {
        db.query
            .mockResolvedValueOnce({ rows: [{ userid: 1 }] })
            .mockResolvedValueOnce({ rows: [{ sessionid: 2, createdat: '2025-01-01' }] });
        getSessionsByEmail('email', (err, res) => {
            expect(err).toBeNull();
            expect(res).toEqual({ userID: 1, sessions: [{ sessionid: 2, createdat: '2025-01-01' }] });
            done();
        });
    });
});

describe('getUserBySessionId', () => {
    afterEach(() => jest.clearAllMocks());

    it('should error if sessionId not number', (done) => {
        getUserBySessionId('abc', (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            done();
        });
    });

    it('should error if session not found', (done) => {
        db.query.mockResolvedValueOnce({ rows: [] });
        getUserBySessionId(1, (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            done();
        });
    });

    it('should error if user not found', (done) => {
        db.query
            .mockResolvedValueOnce({ rows: [{ userid: 1 }] })
            .mockResolvedValueOnce({ rows: [] });
        getUserBySessionId(1, (err) => {
            expect(err).toBeInstanceOf(CustomInputError);
            done();
        });
    });

    it('should succeed in fetching user by session ID', (done) => {
        db.query
            .mockResolvedValueOnce({ rows: [{ userid: 1 }] })
            .mockResolvedValueOnce({ rows: [{ email: 'email', companyname: 'Company' }] });
        getUserBySessionId(1, (err, res) => {
            expect(err).toBeNull();
            expect(res).toEqual({ userId: 1, email: 'email', company: 'Company' });
            done();
        });
    });
});

describe('invalidateSession', () => {
    afterEach(() => jest.clearAllMocks());

    it('should invalidate a session successfully', async () => {
        db.query.mockResolvedValueOnce({ rows: [{}] });

        await invalidateSession(1, (err, res) => {
            expect(err).toBeNull();
            expect(res).toEqual({
                success: true,
                message: 'Session invalidated successfully.',
            });
        });
    });

    it('should return error if session not found', async () => {
        db.query.mockResolvedValueOnce({ rows: [] });

        await invalidateSession(999, (err, res) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toMatch("Session not found");
        });
    });

    it('should handle invalid session ID type', async () => {
        await invalidateSession("abc", (err, res) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toMatch("Invalid session ID");
        });
    });

    it('should handle database error', async () => {
        db.query.mockRejectedValueOnce(new Error('DB failure'));

        await invalidateSession(1, (err, res) => {
            expect(err).toBeInstanceOf(CustomInputError);
            expect(err.message).toMatch("Database error while invalidating session");
        });
    });
});