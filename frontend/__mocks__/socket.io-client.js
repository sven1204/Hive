module.exports = {
  io: () => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    join: jest.fn(),
  }),
};
