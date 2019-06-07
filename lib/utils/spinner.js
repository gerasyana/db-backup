const { Spinner } = require('cli-spinner');

class SpinnerWrapper {
    constructor(message) {
        this.spinner = new Spinner(`%s ${message}`);
        this.spinner.setSpinnerString('⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏');
    }

    run() {
        this.spinner.start();
    }

    stop() {
        this.spinner.stop();
        console.log();
    }
}

module.exports = SpinnerWrapper;

