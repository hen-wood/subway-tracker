document.addEventListener("DOMContentLoaded", () => {
  const churchAveEl = document.getElementById("churchAveTime");
  const churchAveChanceEl = document.getElementById("churchAveChance");
  const courtSquareEl = document.getElementById("courtSquareTime");
  const courtSquareChanceEl = document.getElementById("courtSquareChance");

  setInterval(async () => {
    const { northBound, southBound } = await createList();

    const [churchAveTime, churchAveChance] = southBound.times;
    const [courtSquareTime, courtSquareChance] = northBound.times;

    const churchArrivalString = getMinutesAndSecondsFromNow(churchAveTime);
    const courtArrivalString = getMinutesAndSecondsFromNow(courtSquareTime);

    churchAveEl.innerText = `Arriving ${churchArrivalString}`;
    if (churchArrivalString === "now!") {
      churchAveEl.style.color = "#ab4848";
      churchAveEl.style.fontWeight = "bold";
    } else {
      churchAveEl.style.color = "#000";
      churchAveEl.style.fontWeight = "unset";
    }

    churchAveChanceEl.innerText = `Next chance ${getMinutesAndSecondsFromNow(
      churchAveChance
    )}`;

    courtSquareEl.innerText = `Arriving ${courtArrivalString}`;
    if (courtArrivalString === "now!") {
      courtSquareEl.style.color = "#ab4848";
      courtSquareEl.style.fontWeight = "bold";
    } else {
      courtSquareEl.style.color = "#000";
      courtSquareEl.style.fontWeight = "unset";
    }

    courtSquareChanceEl.innerText = `Next chance ${getMinutesAndSecondsFromNow(
      courtSquareChance
    )}`;
  }, 10 * 1000);
});

async function createList() {
  const res = await fetch(`http://localhost:3000/api/G34`);
  const data = await res.json();

  return data;
}

function getMinutesAndSecondsFromNow(timeString) {
  // Current date and time
  const now = new Date();

  // Extract hours, minutes, and AM/PM from the time string
  const [time, modifier] = timeString.split(" ");
  let [hours, minutes, seconds] = time.split(":");

  // Convert 12-hour format to 24-hour format
  if (hours === "12") {
    hours = "00";
  }
  if (modifier === "PM") {
    hours = parseInt(hours, 10) + 12;
  }

  // Create a new date object for the specified time
  const targetTime = new Date();
  targetTime.setHours(hours, minutes, seconds, 0);

  // Calculate the difference in milliseconds
  let diff = targetTime - now;

  // Calculate minutes and seconds
  const diffMinutes = Math.floor(diff / 60000); // 60000 milliseconds in a minute
  diff -= diffMinutes * 60000;
  const diffSeconds = Math.floor(diff / 1000); // 1000 milliseconds in a second

  // If the difference is negative, set it to 0
  if (diff < 0 || diffMinutes < 1) {
    return "now!";
  }

  return `in ${diffMinutes} minute${
    diffMinutes === 1 ? "" : "s"
  } and ${diffSeconds} second${diffSeconds === 1 ? "" : "s"}`;
}
