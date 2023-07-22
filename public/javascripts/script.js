function addToCart(proId) {
  console.log("adding to cart");
  var spinner = document.getElementById("product-" + proId)
  spinner.removeAttribute('hidden');
  $.ajax({
    url: '/add-to-cart/' + proId,
    method: 'get',
    success: (response) => {
      if (response.status) {
        const sucessToast = $('#add-to-cart-success')
        let count = $('#cart-count').html()
        console.log("cart count : ", count)
        count = parseInt(count) + 1
        $('#cart-count').html(count)
        const toast = new bootstrap.Toast(sucessToast)
        toast.show()
        spinner.setAttribute('hidden', true);
        console.log("success");
      } else {
        const failureToast = $("#add-to-cart-failure")
        const toast = new bootstrap.Toast(failureToast)
        toast.show()
        console.log("failed to add");
        spinner.setAttribute('hidden', true);


      }

    }
  })
} 