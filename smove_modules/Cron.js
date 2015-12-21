var CronJob = require('cron').CronJob;
var job = new CronJob({
    cronTime: '00 30 11 * * 1-7',
    onTick: function () {
    /*
     * Runs every weekday (Monday through Friday)
     * at 11:30:00 AM.
     */
    //recalculate the rating of all providers
    },
    start: false,
    timeZone: 'Asia/Pyongyang'
});
job.start();
module.exports = job;
