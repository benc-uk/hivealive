class Utils {

  static executeCommand(script) {
    return new Promise((resolve, reject) => {
      require('child_process').exec(script, (error, stdout, stderr) => {
        if (error) {
          reject(stderr);
        } else {
          // Return both stdout and stderr in a little tuple object
          resolve({ stdout: stdout, stderr: stderr });
        }
      });
    });
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  }
}

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

module.exports = Utils;