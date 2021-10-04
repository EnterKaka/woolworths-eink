function onclick_get(){
    let db_name = document.getElementById('placeholderInput').value;
    let collection_name = document.getElementById('placeholderInput1').value;
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-danger'
      },
      buttonsStyling: false
    })

    swalWithBootstrapButtons.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, get it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        url = '/data/get/';
        $.post(url, {
          dbname : db_name,
          collectionname: collection_name,
        }, function( data ) {
          if(data.status === 'success') {
            swalWithBootstrapButtons.fire(
              'Got it!',
              'Your db is updated.',
              'success'
            );
            location.reload();
          }else{
            swalWithBootstrapButtons.fire(
              'Failed it!',
              'We cannot access this database.',
              'error'
            );
          }
        });
      }
    })
  }