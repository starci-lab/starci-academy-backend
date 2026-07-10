import re, sys, io

# Convert the §2.1.5 sub-section headings (##### 2.1.5.N. <title>) into a single
# ::::accordion block with N :::panel{title="<title-without-number>"} panels.
# Body of each panel = everything between its heading and the next heading / #### 2.1.6.
# Leaves the intro list untouched (handled manually). Only touches §2.1.5.

def convert(text):
    lines = text.split("\n")
    # find start: first line matching '##### 2.1.5.' ; end: '#### 2.1.6.'
    start = None
    end = None
    for i, l in enumerate(lines):
        if re.match(r'^##### 2\.1\.5\.\d+\.', l):
            start = i
            break
    if start is None:
        return text, 0, "no 2.1.5.N headings"
    for i in range(start, len(lines)):
        if re.match(r'^#### 2\.1\.6\.', lines[i]):
            end = i
            break
    if end is None:
        return text, 0, "no 2.1.6 terminator"

    region = lines[start:end]  # from first panel heading up to (excl) 2.1.6
    # split region into panels by heading
    panels = []  # (title, body_lines)
    cur_title = None
    cur_body = []
    for l in region:
        m = re.match(r'^##### 2\.1\.5\.\d+\.\s*(.+?)\s*$', l)
        if m:
            if cur_title is not None:
                panels.append((cur_title, cur_body))
            cur_title = m.group(1).strip()
            cur_body = []
        else:
            cur_body.append(l)
    if cur_title is not None:
        panels.append((cur_title, cur_body))

    # build accordion
    out = ["::::accordion"]
    for title, body in panels:
        # trim leading/trailing blank lines of body
        while body and body[0].strip() == "":
            body.pop(0)
        while body and body[-1].strip() == "":
            body.pop()
        # escape any double-quote in title
        t = title.replace('"', "'")
        out.append(':::panel{title="%s"}' % t)
        out.append("")
        out.extend(body)
        out.append("")
        out.append(":::")
    out.append("::::")
    out.append("")  # blank before 2.1.6

    new_lines = lines[:start] + out + lines[end:]
    return "\n".join(new_lines), len(panels), "ok"

if __name__ == "__main__":
    path = sys.argv[1]
    with io.open(path, "r", encoding="utf-8") as f:
        txt = f.read()
    new, n, status = convert(txt)
    if status != "ok":
        sys.stderr.write("SKIP %s: %s\n" % (path, status))
        sys.exit(2)
    with io.open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(new)
    print("%s -> %d panels" % (path, n))
