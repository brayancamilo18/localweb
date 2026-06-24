/**
 * Horarios con cierre en madrugada (plantillas HTML públicas).
 * Mantener alineado con front/src/lib/schedule/scheduleTime.ts
 */
(function (global) {
  function lwScheduleMinutes(t) {
    if (!t || typeof t !== 'string') return NaN
    var parts = t.split(':')
    var h = parseInt(parts[0], 10)
    var m = parseInt(parts[1], 10)
    if (isNaN(h) || isNaN(m)) return NaN
    return h * 60 + m
  }

  function lwIsOvernightSchedule(open, close) {
    var o = lwScheduleMinutes(open)
    var c = lwScheduleMinutes(close)
    if (isNaN(o) || isNaN(c)) return false
    return c <= o
  }

  function lwFormatScheduleHours(open, close) {
    return open + ' — ' + close
  }

  function lwIsDayOpenAt(row, cur) {
    if (!row || row.closed) return false
    var open = lwScheduleMinutes(row.open)
    var close = lwScheduleMinutes(row.close)
    if (isNaN(open) || isNaN(close)) return false
    if (lwIsOvernightSchedule(row.open, row.close)) {
      return cur >= open || cur <= close
    }
    return cur >= open && cur <= close
  }

  var LW_DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

  /** horario = { mon: { open, close, closed }, ... } */
  function lwIsScheduleOpenNow(horario) {
    if (!horario || typeof horario !== 'object') return false
    var now = new Date()
    var cur = now.getHours() * 60 + now.getMinutes()
    var todayKey = LW_DAY_KEYS[now.getDay()]
    var yesterdayKey = LW_DAY_KEYS[(now.getDay() + 6) % 7]

    var yesterday = horario[yesterdayKey]
    if (yesterday && !yesterday.closed && lwIsOvernightSchedule(yesterday.open, yesterday.close)) {
      var yClose = lwScheduleMinutes(yesterday.close)
      if (!isNaN(yClose) && cur <= yClose) return true
    }

    return lwIsDayOpenAt(horario[todayKey], cur)
  }

  /** Filas con idx 0=domingo … 6=sábado y open/close string|null */
  function lwIsOpenNowFromIdxRows(rows) {
    if (!Array.isArray(rows)) return false
    var map = {
      mon: { open: '10:00', close: '20:00', closed: true },
      tue: { open: '10:00', close: '20:00', closed: true },
      wed: { open: '10:00', close: '20:00', closed: true },
      thu: { open: '10:00', close: '20:00', closed: true },
      fri: { open: '10:00', close: '20:00', closed: true },
      sat: { open: '10:00', close: '20:00', closed: true },
      sun: { open: '10:00', close: '20:00', closed: true },
    }
    var idxToKey = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' }
    rows.forEach(function (r) {
      var key = idxToKey[r.idx]
      if (!key) return
      if (!r.open || !r.close) {
        map[key] = { open: '00:00', close: '00:00', closed: true }
      } else {
        map[key] = { open: r.open, close: r.close, closed: false }
      }
    })
    return lwIsScheduleOpenNow(map)
  }

  global.lwScheduleMinutes = lwScheduleMinutes
  global.lwIsOvernightSchedule = lwIsOvernightSchedule
  global.lwFormatScheduleHours = lwFormatScheduleHours
  global.lwIsScheduleOpenNow = lwIsScheduleOpenNow
  global.lwIsOpenNowFromIdxRows = lwIsOpenNowFromIdxRows
})(typeof window !== 'undefined' ? window : globalThis)
