import { useCallback } from 'react'
import { useSession } from './session.jsx'

/**
 * Myanmar (Unicode) and English at launch — BRD assumption A5.
 * Short, user-facing strings are translated; long explanatory copy stays in
 * English so a rough translation never changes the meaning of a rule.
 */
const dict = {
  // shell
  'nav.home': ['Home', 'ပင်မ'],
  'nav.tickets': ['Tickets', 'လက်မှတ်'],
  'nav.account': ['Account', 'အကောင့်'],

  // driver app — the words a driver reads on every shift
  'drv.title': ['YanGo Driver', 'YanGo ယာဉ်မောင်း'],
  'drv.tagline': [
    'Start your shift, check the bus, carry your manifest and raise SOS. Tracking runs only while you are on duty.',
    'အလုပ်ဆင်းချိန်စတင်ပါ၊ ကားကိုစစ်ဆေးပါ၊ ခရီးသည်စာရင်းကိုယူဆောင်ပါ။ တာဝန်ကျချိန်တွင်သာ နေရာပြခြင်းလုပ်ဆောင်သည်။',
  ],
  'drv.invited': ['My company invited me', 'ကုမ္ပဏီက ဖိတ်ခေါ်ထားသည်'],
  'drv.invitedHint': [
    'You got an SMS from your bus company. Sign in with that number.',
    'ကုမ္ပဏီထံမှ SMS ရရှိထားပါက ထိုဖုန်းနံပါတ်ဖြင့် ဝင်ရောက်ပါ။',
  ],
  'drv.selfReg': ['I want to register myself', 'ကိုယ်တိုင်စာရင်းသွင်းမည်'],
  'drv.selfRegHint': [
    'Sign up, choose a licensed company and they accept you.',
    'စာရင်းသွင်းပြီး လိုင်စင်ရကုမ္ပဏီတစ်ခုကို ရွေးပါ၊ ၎င်းတို့က လက်ခံပါမည်။',
  ],
  'drv.reviewNote': [
    'Either way, the transport authority reviews your documents before you can drive.',
    'မည်သို့ပင်ဖြစ်စေ သယ်ယူပို့ဆောင်ရေးဌာနက သင့်စာရွက်စာတမ်းများကို စစ်ဆေးပြီးမှ ယာဉ်မောင်းနိုင်ပါမည်။',
  ],
  'drv.nav.home': ['Home', 'ပင်မ'],
  'drv.nav.trips': ['Trips', 'ခရီးစဉ်'],
  'drv.nav.inbox': ['Inbox', 'စာများ'],
  'drv.nav.profile': ['Profile', 'ကိုယ်ရေး'],
  'drv.startShift': ['Start shift check-in', 'အလုပ်ဆင်းရန် စစ်ဆေးမှုစတင်ပါ'],
  'drv.endShift': ['End shift', 'အလုပ်ဆင်းချိန်ပြီးဆုံး'],
  'drv.onDuty': ['On duty', 'တာဝန်ကျနေသည်'],
  'drv.offDuty': ['Off duty', 'တာဝန်မကျပါ'],
  'drv.sos': ['SOS', 'အရေးပေါ်'],
  'drv.tripsToday': ['Trips today', 'ယနေ့ခရီးစဉ်'],
  'drv.completed': ['Completed', 'ပြီးစီး'],
  'drv.hoursWeek': ['Hours this week', 'ဤအပတ်နာရီ'],
  'drv.assignedBus': ['Assigned bus', 'တာဝန်ကျကား'],
  'drv.nextTrips': ['Next trips', 'နောက်ခရီးစဉ်များ'],
  'drv.enterCode': ['Enter the code', 'ကုဒ်ထည့်ပါ'],
  'drv.sendCode': ['Send code', 'ကုဒ်ပို့ပါ'],
  'common.back': ['Back', 'နောက်သို့'],
  'common.continue': ['Continue', 'ဆက်လုပ်ရန်'],
  'common.cancel': ['Cancel', 'မလုပ်တော့ပါ'],
  'common.today': ['Today', 'ယနေ့'],
  'common.tomorrow': ['Tomorrow', 'မနက်ဖြန်'],
  'common.min': ['min', 'မိနစ်'],
  'common.seatsLeft': ['seats left', 'ထိုင်ခုံကျန်'],
  'common.from': ['From', 'မှ'],
  'common.fromPrice': ['from', 'မှစ၍'],
  'common.to': ['To', 'သို့'],
  'common.all': ['All', 'အားလုံး'],
  'common.live': ['LIVE', 'တိုက်ရိုက်'],
  'common.operator': ['Operator', 'ကုမ္ပဏီ'],
  'common.price': ['Price', 'ဈေးနှုန်း'],
  'common.time': ['Time', 'အချိန်'],
  'common.seats': ['Seats', 'ထိုင်ခုံ'],
  'common.total': ['Total', 'စုစုပေါင်း'],
  'common.licensed': ['Licensed', 'လိုင်စင်ရ'],
  'common.active': ['Active', 'အသုံးပြုဆဲ'],
  'common.booked': ['Booked', 'မှာယူပြီး'],
  'common.used': ['Used', 'သုံးပြီး'],
  'common.checkedIn': ['Checked in', 'ဝင်ရောက်ပြီး'],
  'common.expired': ['Expired', 'သက်တမ်းကုန်'],
  'common.justNow': ['just now', 'ယခုပင်'],
  'common.demoData': ['Live data · demo dataset', 'တိုက်ရိုက်အချက်အလက် · စမ်းသပ်မှု'],
  'map.onTime': ['On time', 'အချိန်မှန်'],
  'map.late': ['Running late', 'နောက်ကျနေ'],
  'map.noSignal': ['No signal', 'အချက်ပြမရ'],

  // occupancy
  'occ.empty': ['Empty', 'နေရာလွတ်များ'],
  'occ.some': ['Some seats', 'ထိုင်ခုံအနည်းငယ်'],
  'occ.full': ['Full', 'ပြည့်နေသည်'],
  'occ.unknown': ['Unknown', 'မသိရသေး'],

  // home
  'home.greeting': ['Good day', 'မင်္ဂလာပါ'],
  'home.searchPlaceholder': ['Where are you going?', 'ဘယ်ကိုသွားမလဲ။'],
  'home.buyTicket': ['Buy ticket', 'လက်မှတ်ဝယ်ရန်'],
  'home.busStop': ['Bus stop', 'မှတ်တိုင်'],
  'home.routes': ['Routes', 'လမ်းကြောင်း'],
  'home.assistant': ['Ask YanGo', 'YanGo ကိုမေးရန်'],
  'home.arrivals': ['Arrivals', 'ရောက်ရှိမည့်ကားများ'],
  'home.nearby': ['Stops & terminals near you', 'အနီးအနားရှိ မှတ်တိုင်နှင့် ဂိတ်များ'],
  'home.nearYou': ['Near you', 'သင့်အနီး'],
  'home.noneSoon': ['No bus soon', 'ကားမရှိသေးပါ'],
  'home.rightHere': ['Right here', 'ဤနေရာတွင်'],
  'home.firstBus': ['First bus {t}', 'ပထမကား {t}'],
  'home.resumes': ['Service resumes {t}', 'ဝန်ဆောင်မှု {t} တွင်ပြန်စမည်'],
  'home.busesHere': ['Buses arriving here', 'ဤနေရာသို့ရောက်မည့်ကားများ'],
  'home.routesFromHere': ['Routes from here', 'ဤနေရာမှ လမ်းကြောင်းများ'],
  'terminal.arrivingHere': ['Services arriving here', 'ဤနေရာသို့ရောက်ရှိသောခရီးစဉ်များ'],
  'terminal.from': ['From', 'မှ'],
  'home.nearestStop': ['nearest stop', 'အနီးဆုံးမှတ်တိုင်'],
  'home.activeTicket': ['Active ticket', 'အသုံးပြုနိုင်သောလက်မှတ်'],
  'home.validUntil': ['Valid until 23:59 today', 'ယနေ့ ၂၃:၅၉ အထိ သုံးနိုင်သည်'],
  'home.noBuses': ['No buses transmitting near this stop right now.', 'ယခုအချိန်တွင် ဤမှတ်တိုင်အနီး ကားမရှိသေးပါ။'],
  'home.wallet': ['Wallet', 'ပိုက်ဆံအိတ်'],
  'home.emergency': ['Emergency', 'အရေးပေါ်'],
  'home.holdSos': ['Hold for SOS', 'SOS အတွက် ဖိထားပါ'],
  'home.kmAway': ['km away', 'ကီလိုမီတာအကွာ'],
  'home.demoNote': ['Live data · demo dataset', 'တိုက်ရိုက်အချက်အလက် · စမ်းသပ်မှု'],

  // search & results
  'search.title': ['Plan a journey', 'ခရီးစဉ်စီစဉ်ရန်'],
  'search.destination': ['Where to?', 'ဘယ်ကိုသွားမလဲ။'],
  'search.startingFrom': ['Starting from', 'စတင်မည့်နေရာ'],
  'search.when': ['When do you travel?', 'ဘယ်အချိန်သွားမလဲ။'],
  'search.now': ['Leave now', 'ယခုထွက်မည်'],
  'search.later': ['Leave later', 'နောက်မှထွက်မည်'],
  'search.findBuses': ['Find buses', 'ကားရှာရန်'],
  'search.preview': ['Your journey', 'သင့်ခရီးစဉ်'],
  'search.chooseDestination': ['Choose a destination to continue', 'ဆက်လုပ်ရန် သွားမည့်နေရာရွေးပါ'],
  'search.subtitle': ['Myanmar / English · voice supported', 'မြန်မာ / အင်္ဂလိပ် · အသံဖြင့်ရှာနိုင်သည်'],
  'search.savedPlaces': ['Saved places', 'သိမ်းထားသောနေရာများ'],
  'search.recent': ['Recent', 'မကြာသေးမီက'],
  'search.searchFrom': ['Search a starting point…', 'စတင်မည့်နေရာရှာရန်…'],
  'search.searchTo': ['Search a destination…', 'သွားမည့်နေရာရှာရန်…'],
  'results.options': ['options', 'ရွေးချယ်စရာ'],
  'results.fastest': ['Fastest', 'အမြန်ဆုံး'],
  'results.transfers': ['transfers', 'ကားပြောင်း'],
  'results.walk': ['walk', 'လမ်းလျှောက်'],
  'results.noRoute': ['No route found', 'လမ်းကြောင်းမတွေ့ပါ'],

  // explore
  'explore.title': ['Explore', 'လေ့လာရန်'],
  'explore.subtitle': ['Routes, stops and terminals', 'လမ်းကြောင်း၊ မှတ်တိုင်နှင့် ဂိတ်များ'],
  'explore.inCity': ['In city', 'မြို့တွင်း'],
  'explore.intercity': ['Intercity', 'မြို့ချင်းဆက်'],
  'explore.stops': ['Stops', 'မှတ်တိုင်များ'],
  'explore.terminals': ['Terminals', 'ဂိတ်များ'],
  'explore.lines': ['lines', 'လမ်းကြောင်း'],
  'explore.line': ['line', 'လမ်းကြောင်း'],
  'search.nearby': ['Stops near you', 'သင့်အနီးမှတ်တိုင်များ'],

  // booking
  'book.chooseDeparture': ['Choose a departure', 'ထွက်ခွာချိန်ရွေးရန်'],
  'book.departures': ['departures', 'ထွက်ခွာချိန်'],
  'book.nextDepartures': ['Next 40 departures', 'နောက်ထပ် ထွက်ခွာချိန် ၄၀'],
  'book.departed': ['Departed', 'ထွက်ခွာပြီး'],
  'book.full': ['Full', 'ပြည့်နေသည်'],
  'book.earlier': ['Earlier today', 'ယနေ့စောစောပိုင်း'],
  'book.dayFinished': ['No more departures today', 'ယနေ့အတွက် ထွက်ခွာချိန်မကျန်တော့ပါ'],
  'book.lineHours': ['This line runs', 'ဤလမ်းကြောင်းပြေးဆွဲချိန်'],
  'book.noneLeftIntercity': [
    'Every departure on this day has left. Pick another day or another operator on the same corridor.',
    'ယနေ့ထွက်ခွာချိန်အားလုံး ထွက်သွားပြီ။ အခြားရက် သို့မဟုတ် အခြားကုမ္ပဏီရွေးပါ။',
  ],
  'book.nextService': ['Next service', 'နောက်ထပ်ပြေးဆွဲချိန်'],
  'book.chooseSeat': ['Choose a seat', 'ထိုင်ခုံရွေးရန်'],
  'book.boardingPoint': ['Boarding point', 'တက်မည့်နေရာ'],
  'book.droppingPoint': ['Dropping point', 'ဆင်းမည့်နေရာ'],
  'book.heldFor': ['Held for', 'ဖမ်းထားသည်'],
  'book.pickSeat': ['Pick at least one seat', 'အနည်းဆုံး ထိုင်ခုံတစ်ခုရွေးပါ'],
  'book.reviewPay': ['Review & pay', 'စစ်ဆေးပြီး ငွေပေးရန်'],
  'book.yourTrip': ['Your trip', 'သင့်ခရီးစဉ်'],
  'book.paymentMethod': ['Payment method', 'ငွေပေးချေမှုနည်းလမ်း'],
  'book.promo': ['Promo code', 'ပရိုမိုကုဒ်'],
  'book.apply': ['Apply', 'အသုံးပြုရန်'],
  'book.pay': ['Pay', 'ငွေပေးရန်'],
  'book.concession': ['Concession', 'လျှော့စျေး'],
  'book.noConcession': ['No concession', 'လျှော့စျေးမယူပါ'],
  'book.student': ['Student · 50%', 'ကျောင်းသား · ၅၀%'],
  'book.elderly': ['Elderly 60+ · 50%', 'သက်ကြီး ၆၀+ · ၅၀%'],

  // ticket
  'ticket.eticket': ['E-ticket', 'အီလက်ထရွန်နစ်လက်မှတ်'],
  'ticket.myTickets': ['My tickets', 'ကျွန်ုပ်၏လက်မှတ်များ'],
  'ticket.upcoming': ['Upcoming', 'လာမည့်ခရီး'],
  'ticket.history': ['History', 'မှတ်တမ်း'],
  'ticket.buyTicket': ['Buy a ticket', 'လက်မှတ်ဝယ်ရန'],
  'ticket.checkIn': ['Check in now', 'ချက်အင်လုပ်ရန်'],
  'ticket.checkedIn': ['Checked in', 'ချက်အင်လုပ်ပြီး'],
  'ticket.track': ['Track', 'ခြေရာခံရန်'],
  'ticket.share': ['Share', 'မျှဝေရန်'],
  'ticket.save': ['Save', 'သိမ်းရန်'],
  'ticket.offlineQr': ['Signed QR — works without a data connection', 'QR ကုဒ် — အင်တာနက်မလိုပါ'],
  'ticket.passenger': ['Passenger', 'ခရီးသည်'],
  'ticket.farePaid': ['Fare paid', 'ပေးချေပြီးခ'],
  'ticket.busAssigned': ['Bus assigned', 'သတ်မှတ်ကား'],
  'ticket.departure': ['Departure', 'ထွက်ခွာချိန'],
  'ticket.none': ['No tickets yet', 'လက်မှတ်မရှိသေးပါ'],
  'ticket.noneHint': [
    'Buy one from a route, or plan a journey from the home screen.',
    'ပင်မစာမျက်နှာမှ ခရီးစဉ်ရှာပြီး လက်မှတ်ဝယ်နိုင်သည်။',
  ],

  // account
  'account.title': ['Account', 'အကောင့်'],
  'account.editProfile': ['Edit profile', 'ကိုယ်ရေးအချက်အလက်ပြင်ရန်'],
  'account.travel': ['Travel', 'ခရီးသွားခြင်း'],
  'account.moneyGroup': ['Payment', 'ငွေပေးချေမှု'],
  'account.safetyGroup': ['Safety & help', 'ဘေးကင်းရေးနှင့် အကူအညီ'],
  'account.settingsGroup': ['Settings', 'ဆက်တင်များ'],
  'account.wallet': ['Wallet', 'ပိုက်ဆံအိတ်'],
  'account.paymentMethods': ['Payment methods', 'ငွေပေးချေမှုနည်းလမ်းများ'],
  'account.favourites': ['Favourite stops', 'အနှစ်သက်ဆုံးမှတ်တိုင်'],
  'account.recentPlaces': ['Recent destinations', 'မကြာသေးမီက သွားခဲ့သောနေရာ'],
  'account.alerts': ['Service alerts', 'ဝန်ဆောင်မှုသတိပေးချက်'],
  'account.notifications': ['Notifications', 'အသိပေးချက်များ'],
  'account.sos': ['Emergency SOS', 'အရေးပေါ် SOS'],
  'account.report': ['Report an incident', 'ဖြစ်စဉ်တိုင်ကြားရန်'],
  'account.myReports': ['My reports', 'ကျွန်ုပ်၏တိုင်ကြားချက်'],
  'account.assistant': ['Ask YanGo', 'YanGo ကိုမေးရန်'],
  'account.verify': ['Verify a bus licence', 'ကားလိုင်စင်စစ်ဆေးရန်'],
  'account.language': ['Language', 'ဘာသာစကား'],
  'account.accessibility': ['Accessibility', 'အသုံးပြုလွယ်ကူမှု'],
  'account.privacy': ['Privacy & data', 'ကိုယ်ရေးအချက်အလက်'],
  'account.signOut': ['Sign out', 'ထွက်ရန်'],
  'account.ticketsStay': ['Your tickets stay on this device.', 'သင့်လက်မှတ်များသည် ဤစက်ပစ္စည်းတွင်သာ ရှိနေသည်။'],
  'account.member': ['With YanGo since', 'YanGo နှင့်အတူ'],

  // safety
  'safety.title': ['Safety', 'ဘေးကင်းရေး'],
  'safety.sosDesc': [
    'Shares your live location, nearest stop and active ticket with the authority, the operator and emergency dispatch.',
    'သင့်တည်နေရာ၊ အနီးဆုံးမှတ်တိုင်နှင့် လက်မှတ်ကို အာဏာပိုင်၊ ကုမ္ပဏီနှင့် အရေးပေါ်ဌာနသို့ ပို့ပေးပါမည်။',
  ],
  'safety.numbers': ['Emergency numbers', 'အရေးပေါ်ဖုန်းနံပါတ်များ'],
}
export const LANGS = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'my', label: 'မြန်မာ (Myanmar)', short: 'MM' },
]
export function useT(portal = 'citizen') {
  const [ses, setSes] = useSession(portal)
  const lang = ses.lang === 'my' ? 'my' : 'en'
  const t = useCallback(
    (key, fallback) => {
      const entry = dict[key]
      if (!entry) return fallback ?? key
      return entry[lang === 'my' ? 1 : 0] || entry[0]
    },
    [lang],
  )
  return { t, lang, setLang: (code) => setSes({ lang: code }) }
}
