// Independent optional-direction enhancement; no provider or auth dependency.
export function initDirection() {
  const direction = document.getElementById('ai-instruction');
  const grow = () => {
    if (direction.clientWidth && direction.scrollHeight > direction.clientHeight) {
      direction.style.height = (direction.scrollHeight + 2) + 'px';
    }
  };
  direction.addEventListener('input', grow);
  window.addEventListener('resize', grow);
}
