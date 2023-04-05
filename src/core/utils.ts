/**
* Extension events limiter.
* This class is responsible for managing  the  events of the extension to
* avoid duplicated events, because the debouncing method didn't work well.
* First we initilize EventsLimit with desired limit in ms and then we register
* the function to be fired one time immediatly(leading) or the last (tailing)
* until the timeout is over.
*/
export class EventsLimit {
  private tailTimer: number = undefined;
  private leadTimer: number = undefined;
  private isCalled: boolean = false;
  private timeout: NodeJS.Timeout;
  private func: Function = undefined;

  /**
  * EventsLimit constructor.
  * @param _tailTimer The limit in milliseconds for the tailing event.
  * @param _leadTimer The limit in milliseconds for the leading event.
  */
  constructor (_tailTimer: number = 100, _leadTimer: number = 100) {
    this.tailTimer = _tailTimer;
    this.leadTimer = _leadTimer;
  }

  /**
  * Register callback function
  * @param func The function to be fired one time immediatly(leading) or the last (tailing)
  */
  public Register = (func: Function) => {
    this.func = func;
  }

  /* Checking if the function is called, if not it calls the registered function
  * and then resets the timer.
  */
  public Lead = () => {
    if (!this.isCalled) {
      this.isCalled = true;
      this.func();
    }
    setTimeout(() => {
      this.isCalled = false;
    }, this.leadTimer)
  }

  /**
  * Because some events like onDidChangeActiveTextEditor get fired twice when
  * an editor tab is opened. The first event is for the visible range of pre
  * mouse position and then gets another event but with the correct visible range.
  * So we will use this method to fire the last passed event.
  */
  public Tail = () => {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.func(), this.tailTimer);
  }
}