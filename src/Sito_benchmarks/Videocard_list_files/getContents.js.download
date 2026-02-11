	//Simple code to read in each of the cpu's from the 2 table contained in the html body

	var totalRows = 0;
	
	//Get table contents via their id
	if( document.getElementById('cputable') )
	{
		var myTable = document.getElementById('cputable');
		for (i = 1;i < myTable.rows.length; i++) {
			collection[totalRows] = myTable.rows[i].cells[0].innerText || myTable.rows[i].cells[0].textContent;
			totalRows++;
		}
	}
			
	if( document.getElementById('multicpu') )
	{
		var myTable = document.getElementById('multicpu');
		for (i = 1;i < myTable.rows.length; i++) {
			collection[totalRows] = myTable.rows[i].cells[0].innerText || myTable.rows[i].cells[0].textContent;
			totalRows++;
		}	
	}

