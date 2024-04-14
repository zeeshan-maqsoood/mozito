module.exports = {
  apps : [{
    script: 'index.js',
    error: './error.log',
    // log: './combined.outerr.log',
    merge_logs: true,
    log_date_format:"YYYY-MM-DD HH:mm:ss"
  }]
};
