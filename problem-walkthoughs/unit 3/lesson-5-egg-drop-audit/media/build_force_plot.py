from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Draw a scientific chart from exact data coordinates; no source image is edited.
out = Path(__file__).parent
im = Image.new('RGB', (1800, 840), '#faf9f5')
d = ImageDraw.Draw(im)
font_path = 'C:/Windows/Fonts/arial.ttf'
bold_path = 'C:/Windows/Fonts/arialbd.ttf'
font = ImageFont.truetype(font_path, 27)
small = ImageFont.truetype(font_path, 23)
bold = ImageFont.truetype(bold_path, 32)
ink = '#17354d'
baseline, chart_h, chart_w = 630, 480, 640
for x0, duration, force, color, fill, label in [
    (145, .020, 14.85, '#234b6e', '#cbd7e0', 'Short stop'),
    (1015, .060, 4.95, '#18807f', '#c5ded9', 'Long stop'),
]:
    x_end = x0 + chart_w * duration / .080
    y_top = baseline - chart_h * force / 16
    for y_val in (0, 4, 8, 12, 16):
        y = baseline - chart_h * y_val / 16
        d.line((x0, y, x0 + chart_w, y), fill='#d5dddf', width=2)
        d.text((x0 - 18, y), str(y_val), font=font, fill=ink, anchor='rm')
    d.rectangle((x0, y_top, x_end, baseline), fill=fill)
    d.line((x0, y_top, x_end, y_top, x_end, baseline), fill=color, width=5)
    d.line((x0, baseline - chart_h, x0, baseline, x0 + chart_w, baseline), fill='#728391', width=3)
    for t, lab in [(0, '0'), (.020, '0.020'), (.040, '0.040'), (.060, '0.060'), (.080, '0.080')]:
        x = x0 + chart_w * t / .080
        d.text((x, baseline + 25), lab, font=font, fill=ink, anchor='mt')
    d.text((x0 + chart_w / 2, 45), label, font=bold, fill=color, anchor='mt')
    d.text((x0, 106), 'Average net force (N)', font=font, fill=ink, anchor='lt')
    d.text(((x0 + x_end) / 2, (y_top + baseline) / 2 - 8), f'{force:.2f} N', font=bold, fill=color, anchor='mm')
    d.text(((x0 + x_end) / 2, baseline - 28), f'{duration:.3f} s', font=small, fill=color, anchor='mm')
    d.text((x0 + chart_w / 2, 704), 'Time (s)', font=font, fill=ink, anchor='mt')
d.text((900, 786), 'Equal shaded areas represent equal impulse.  Average-force models, not measured traces.', font=font, fill=ink, anchor='mt')
im.save(out / 'equal-impulse-force-time.png')
print(out / 'equal-impulse-force-time.png')
