import {useEffect, useState} from "../_snowpack/pkg/react.js";
import * as Tone from "../_snowpack/pkg/tone.js";
import {TimeSpan} from "../_snowpack/link/strudel.js";
function useCycle(props) {
  const {onEvent, onQuery, onSchedule, ready = true} = props;
  const [started, setStarted] = useState(false);
  const cycleDuration = 1;
  const activeCycle = () => Math.floor(Tone.Transport.seconds / cycleDuration);
  const query = (cycle = activeCycle()) => {
    const timespan = new TimeSpan(cycle, cycle + 1);
    const events = onQuery?.(timespan) || [];
    onSchedule?.(events, cycle);
    const cancelFrom = timespan.begin.valueOf();
    Tone.Transport.cancel(cancelFrom);
    const queryNextTime = (cycle + 1) * cycleDuration - 0.5;
    const t = Math.max(Tone.Transport.seconds, queryNextTime) + 0.1;
    Tone.Transport.schedule(() => {
      query(cycle + 1);
    }, t);
    events?.filter((event) => event.part.begin.valueOf() === event.whole.begin.valueOf()).forEach((event) => {
      Tone.Transport.schedule((time) => {
        const toneEvent = {
          time: event.part.begin.valueOf(),
          duration: event.whole.end.sub(event.whole.begin).valueOf(),
          value: event.value
        };
        onEvent(time, toneEvent);
      }, event.part.begin.valueOf());
    });
  };
  useEffect(() => {
    ready && query();
  }, [onEvent, onSchedule, onQuery, ready]);
  const start = async () => {
    setStarted(true);
    await Tone.start();
    Tone.Transport.start("+0.1");
  };
  const stop = () => {
    console.log("stop");
    setStarted(false);
    Tone.Transport.pause();
  };
  const toggle = () => started ? stop() : start();
  return {start, stop, setStarted, onEvent, started, toggle, query, activeCycle};
}
export default useCycle;
