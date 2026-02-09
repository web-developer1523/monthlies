const categories = document.querySelectorAll('.ingredients__category');
const categoryContainers = document.querySelectorAll('.ingredients__items-container');

categories.forEach(category_item => {
  category_item.addEventListener('click', () => {

    const oldSelected = document.querySelector('.ingredients__category.is--selected');
    oldSelected && oldSelected.classList.remove('is--selected');

    category_item.classList.add('is--selected');

    const handle = category_item.dataset.handle;
    categoryContainers.forEach(container => {
      if (container.dataset.handle != handle) {
        container.classList.add('is--hide');
      } else {
        container.classList.remove('is--hide');
      }
    });
  })
});
