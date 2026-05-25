/** Keep in sync with mount-delimiter.constants.ts */
const MOUNT_SECTION_DELIMITER_LINE = "<!-- @starci/seperator -->"
const MOUNT_SECTION_DELIMITER_LINE_RE = /^\s*<!--\s*@starci\/seperator\s*-->\s*$/

function isDelimiterLine(line) {
    return MOUNT_SECTION_DELIMITER_LINE_RE.test(line)
}

/** @deprecated Use isDelimiterLine */
function isAnyDelimiterLine(line) {
    return isDelimiterLine(line)
}

module.exports = {
    MOUNT_SECTION_DELIMITER_LINE,
    MOUNT_SECTION_DELIMITER_LINE_RE,
    isDelimiterLine,
    isAnyDelimiterLine,
}
