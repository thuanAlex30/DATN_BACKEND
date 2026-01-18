/**
 * Simple Express concurrency limiter middleware.
 * Usage: const limiter = require('./middlewares/concurrencyLimiter')(5);
 * app.post('/some', limiter, controller.someRoute);
 */
module.exports = function concurrencyLimiter(limit = 5) {
  let active = 0;
  const queue = [];

  const runNext = () => {
    if (queue.length === 0) return;
    const fn = queue.shift();
    fn();
  };

  return function (req, res, next) {
    const execute = () => {
      active++;
      let finished = false;
      const cleanup = () => {
        if (finished) return;
        finished = true;
        active--;
        // schedule next tick to avoid deep recursion
        setImmediate(runNext);
      };

      res.once('finish', cleanup);
      res.once('close', cleanup);
      try {
        next();
      } catch (err) {
        cleanup();
        throw err;
      }
    };

    if (active < limit) {
      execute();
    } else {
      queue.push(execute);
      // optional: prevent memory growth by capping queue length
      if (queue.length > 1000) {
        console.warn('Concurrency limiter queue size exceeded 1000, dropping oldest');
        queue.shift();
      }
    }
  };
};


