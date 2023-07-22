function addToCart(proId) {
  const toastLiveExample = document.getElementById('liveToast')
  console.log("function call");
  var spinner = document.getElementById("product-" + proId)
  spinner.removeAttribute('hidden');
  $.ajax({
    url: '/add-to-cart/' + proId,
    method: 'get',
    success: (response) => {
      if (response.status) {
        let count = $('#cart-count').html()
        console.log(count)
        count = parseInt(count) + 1
        $('#cart-count').html(count)
        const toast = new bootstrap.Toast(toastLiveExample)
        toast.show()
        spinner.setAttribute('hidden',true);

      }

    }
  })
} 