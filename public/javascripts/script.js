function addToCart(proId){
    $.ajax({
     url:'/add-to-cart/'+proId,
     method:'get',
     success:(response)=>{ 
        if(response.status){
            let count=$('#cart-count').html()
            console.log(count)
            count=parseInt(count)+1
            $('#cart-count').html(count)
        }
       
     }
   })
 } 