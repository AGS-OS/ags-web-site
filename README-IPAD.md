# AGS — publishing from an iPad

Everything is finished. Nothing here needs to be built, converted or run.

---

## 1 · Upload

1. On github.com, create a new repository.
2. Open it, then choose **Add file → Upload files**.
3. Upload the **contents** of this folder — `index.html`, `assets`, `CNAME`
   and the rest. Not the folder itself: `index.html` must sit at the top
   level of the repository.
4. Scroll down and press **Commit changes**.

If the upload stops halfway on iPad, commit what has arrived and upload the
rest in a second batch. The `assets/img` folder is the big one; it can go on
its own.

## 2 · Publish

1. **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** · Folder: **/(root)**
4. **Save**, then wait two or three minutes for the link to appear.

The site works immediately at `https://YOURNAME.github.io/REPOSITORY/`.

## 3 · The domain

`CNAME` is already in the package and already contains:

```
www.agsproduction.fr
```

GitHub reads it automatically. The last step happens at your domain provider,
not here: point the DNS for `www` to GitHub Pages (a CNAME record to
`YOURNAME.github.io`). Until that is done, the github.io address is the live
one — everything else already works.

---

## If something looks wrong

**404 after publishing.** Pages was not enabled, or `index.html` ended up
inside a folder. Open the repository: you should see `index.html` in the file
list straight away, not a folder you have to open first.

**Images missing.** The `assets` folder did not finish uploading. Upload
`assets/img` again on its own; GitHub replaces what is already there.

**Some pages work, others 404.** File names are case-sensitive on GitHub.
Every file here is lowercase — keep it that way.

**Upload interrupted.** Commit what arrived, then upload the rest. Nothing
breaks from uploading in several passes.

**Domain not resolving yet.** DNS takes up to 24 hours. Use the github.io
address meanwhile. Once it resolves, tick *Enforce HTTPS* in Settings → Pages.

---

## What is in the package

Nine pages, one stylesheet, one script, 104 images. No frameworks, no build
step, no server code. The only thing loaded from outside is Google Fonts.

Deliberately not included, and why:

- **French and Spanish.** The switcher shows FR and ES as plain text, not
  links. They are not translations waiting to be turned on — each deserves its
  own edition, and inventing them would be worse than their absence.
- **A press kit.** Press and partnership enquiries go to the address on the
  institution page.
- **Sound.** Present and working, but off until someone asks for it. There is
  no autoplay anywhere.

---

## Before you send this to anyone who matters

Five statements on the site come from your own documents but are not yet
documented for the public. They are written cautiously on purpose. Confirm
them, and they can become stronger:

1. **"Performed since 2014"** and **"Europe and Latin America"** — a list of
   seasons and venues would let this become specific.
2. **"Two decades of playing for children"**, **"years directing public
   conservatories"** — exact spans are stronger than round ones, once
   documented.
3. **"Thirteen chapters"**, **"closed until the first work is finished"** —
   check this matches the frozen release.
4. **Marie Curie, "in preparation"** — deliberately not "in production".
   Change it only when a production start is real.
5. **Legal identity.** The site names *AGS Production* as publisher and says
   registration details are available on request. If the registered entity
   has a different exact name or legal form, that line on `legal.html` is the
   one to correct — and it is the only place it appears.

The audience figure from the deck — the million children and families — is
**not** on the site. It returns the day there is a document behind it.
