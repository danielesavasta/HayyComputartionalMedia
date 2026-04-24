# Hayy Computational Media

A web-based interactive presentation and map for exploring foundational concepts in generative and computational media.

## Features
- **Interactive Slides**: Navigate through concepts using Swiper.js-powered slides.
- **Custom Map Visualization**: Visual map of computational media principles, properties, processes, and tools.
- **Markdown Content**: Main content is authored in Markdown for easy editing.
- **Custom Cursor & UI**: Enhanced user experience with a custom cursor and animated effects.
- **Responsive Design**: Scales to fit any screen size.

## Technologies Used
- HTML5, CSS3 (custom styles, Normalize.css)
- JavaScript (vanilla, no frameworks)
- [Swiper.js](https://swiperjs.com/) for slide navigation
- [Markdown-it](https://github.com/markdown-it/markdown-it) for Markdown parsing
- [Zooming.js](https://desmonding.me/zooming/) for image zoom
- [SortableJS](https://sortablejs.github.io/Sortable/) for drag-and-drop (if enabled)

## File Structure
- `index.html` — Main HTML entry point
- `content.md` — Markdown source for slides and map
- `start.js` — Main JavaScript logic (slide loading, navigation, etc.)
- `css/` — Stylesheets and fonts
  - `styles.css` — Custom styles
  - `normalize.css` — CSS normalization
  - `DrukWideBold.ttf` — Custom font
- `lib/` — Third-party libraries (minified)
- `LICENSE` — MIT License

## Getting Started
1. Clone or download this repository.
2. Open `index.html` in your browser. No build step required.
3. Edit `content.md` to update the presentation content.

## Customization
- **Add Slides**: Edit `content.md` using the provided slide structure.
- **Change Styles**: Modify `css/styles.css` for custom themes or layout tweaks.
- **Add Libraries**: Place additional JS/CSS in the `lib/` folder and reference them in `index.html`.

## License
MIT License — see [LICENSE](LICENSE) for details.

---
© 2026 Daniele Savasta
