const scrollToPageTop = () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.querySelector('.admin-content')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
};

export default scrollToPageTop;
