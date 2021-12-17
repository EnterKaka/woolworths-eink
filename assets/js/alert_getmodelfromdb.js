var table;
function onclick_get(privilege){
  console.log(privilege)
        $('#table_main_data').html('');
        url = '/data/get';
        table.clear().draw();
        table.destroy();
        $('table').width('calc(100% - 15px)');
        // $('.dataTables_scrollHeadInner').width('100%');
        $('#prepross').html('<img src="/img/loading.gif">');
        $.post( url, function( queryResult ) {
          table = $('table').DataTable( {
            responsive: true,
            autoWidth: true,
            processing: true,
            data: queryResult.data,
            order: [[ 1, "desc" ]],
            scrollX:        true,
            scrollCollapse: true,
            fixedColumns: {
              left: 1,
            },
            columns: [
                { data: 'name', responsivePriority: 1, targets: 0 },
                { data: 'date', targets: 1},
                { data: 'time', targets: 2},
                { data: 'mass', targets: 3,render:function(data,type,row){
                  return data.toFixed(2) + ' t';
                }},
                { data: 'volume', targets: 4,render:function(data,type,row){
                  return data.toFixed(2) + ' m³';
                }},
                {  data: 'setid', width: '20%', targets: 5, render:function ( data, type, row ) {
                  if(privilege == 'engineer'||privilege == 'admin')
                    return '<a href="/data/view/' + row._id + '" class="btn btn-custom-line mr-1 mb-1" style="padding:0.75rem; min-width: 3rem; margin-right: 15px;"><i class="fa fa-eye" aria-hidden="true"></i></a><a href="/data/edit/' + row._id + '" class="btn btn-custom-line mr-1 mb-1" style="padding:0.75rem; min-width: 3rem; margin-left: 15px;"><i class="fa fa-pencil" aria-hidden="true"></i></a><a onclick="delete_model(\'' + row._id + '\',this)" class="btn btn-custom-line mr-1 mb-1" style="padding:0.75rem; min-width: 3rem; margin-left: 15px;"><i class="fa fa-remove" aria-hidden="true"></i></a>';
                  else
                  return '<a href="/data/view/' + row._id + '" class="btn btn-custom-line mr-1 mb-1" style="padding:0.75rem; min-width: 3rem; margin-right: 15px;"><i class="fa fa-eye" aria-hidden="true"></i></a>';}}
                ],
                initComplete: function(settings, json) {
                  $('#prepross').empty();
                  $('table').width('100%');
                  $('.dataTables_scrollHeadInner').width('100%');

                }
              });
        });
  }
function delete_model(id,obj){
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
	confirmButtonText: 'Yes, delete it!',
	cancelButtonText: 'No, cancel!',
	reverseButtons: true
	}).then((result) => {
	if (result.isConfirmed) {
    $.post('/data/delete', { _id: id }, function (data) {
      if(data === 'success') {
        table.row($(obj).parents('tr')).remove().draw();
        swalWithBootstrapButtons.fire(
				'Deleted!',
				'Your file has been deleted.',
				'success'
				);
				// table.row(id).remove().draw();
			}
		});

		// url = '/user/delete/' + url_del;
		// $.get(url, function( data ) {
		// });
	}
	})

}

