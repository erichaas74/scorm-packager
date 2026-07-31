# new-lesson-4-netlify

Static hosted build of the Reaction Time Kinematics Lab for Netlify Drop.

## Upload to Netlify

1. Go to `https://app.netlify.com/drop`
2. Upload this folder or the `new-lesson-4-netlify.zip` file
3. Wait for Netlify to publish the site
4. Copy the final `https://...netlify.app` URL

## What this hosted build does

- Runs as a normal static site with no build step
- Uses no outside libraries or package installs
- Can later sit inside a SCORM shell iframe in Buzz
- Sends progress to a parent shell with `postMessage` when embedded

## Message bridge contract for the later Buzz shell

Hosted app sends messages on channel `reaction-time-lab` from source `reaction-time-lab-host`.

- `launch-request`
- `set-suspend-data`
- `set-status`
- `clear-state`
- `submitted`

The future SCORM shell should answer `launch-request` with source `reaction-time-lab-shell` and type `launch-data`, returning a payload like:

```json
{
  "suspendData": "{...}",
  "lessonStatus": "incomplete"
}
```

That shell can then write Buzz SCORM values while this hosted app stays on Netlify.
