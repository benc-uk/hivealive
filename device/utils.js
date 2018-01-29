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
}

module.exports = Utils;