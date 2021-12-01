var table;
function onclick_get(){
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
                  return '<a href="/data/view/' + row._id + '" class="btn btn-custom-line mr-1 mb-1" style="padding:0.75rem; min-width: 3rem; margin-right: 15px;"><i class="fa fa-eye" aria-hidden="true"></i></a><a href="/data/edit/' + row._id + '" class="btn btn-custom-line mr-1 mb-1" style="padding:0.75rem; min-width: 3rem; margin-left: 15px;"><i class="fa fa-pencil" aria-hidden="true"></i></a>';}},
                ],
                initComplete: function(settings, json) {
                  $('#prepross').empty();
                  $('table').width('100%');
                  $('.dataTables_scrollHeadInner').width('100%');

                }
              });
        });
        // $.post(url, function( data ) {
        //   console.log(data);
        //   if(data.status === 'success') {
        //     let sentdata = data.data;
        //     let tabletag = $('#table_main_data');
        //     if(tabletag){
        //       let tableinnerhtml;
        //       sentdata.forEach(element => {
        //         let onerow = '<tr>'+
        //         '<td>' + element.name + '</td>'+
        //         '<td>' + element.date + '</td>'+
        //         '<td>' + element.time + '</td>'+
        //         '<td>' + element.mass + '</td>'+
        //         '<td>' + element.volume + '</td>'+
        //         '<td>'+
        //         '<div style="float:left">'+
        //         '<a href="/data/view/' + element._id + '" class="btn btn-primary btn-min-width mr-1 mb-1">View</a>' +	
        //         '</div>'+
        //         '</td>'+
        //         '</tr>';
        //         tableinnerhtml += onerow;
        //       });
        //       tabletag.html(tableinnerhtml);
        //     }
        //     swalWithBootstrapButtons.fire(
        //       'Got it!',
        //       'Your db is updated.',
        //       'success'
        //     );
        //     // location.reload();
        //   }else{
        //     $('#table_main_data').html('');
        //     swalWithBootstrapButtons.fire(
        //       'Failed it!',
        //       'We cannot access this database.',
        //       'error'
        //     );
        //   }
        // });
  }



function init_socket(){
  //socket
  var socket = io();
  // socket.emit('broad message', 'Hello Hello hello');
  socket.on('broad message', function(msg) {
      // console.log(msg);
      location.reload();
  });
}

init_socket();