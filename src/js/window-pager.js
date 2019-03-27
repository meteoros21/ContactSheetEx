function PagerWindow(contactSheet)
{
    this.contactSheet = contactSheet;
    this.sheetInfo = contactSheet.sheetInfo;
    this.container = null;

    this.create = function (parent)
    {
        $('.pagination').remove();

        this.container = $('<div class="pagination"></div>');
        parent.append(this.container);

        this.update();

        // var page  = this.sheetInfo.currentPage == 0 ? 1 : this.sheetInfo.currentPage;
        // var page10 = Math.ceil(page / 10);
        // var pageCnt = this.sheetInfo.getPageCount();
        // var pageCnt10 = Math.ceil(pageCnt / 10);
        // var startPage = 1 + (page10-1) * 10;
        // var endPage = (startPage + 9 > pageCnt) ? pageCnt : startPage + 9;
        //
        // var prevPage = (page10-1) * 10;
        // var nextPage = (page10) * 10 + 1;
        //
        // var html = '<div class="pagination">';
        //
        // if (prevPage > 0)
        //     html += '<a href="#" page="' + prevPage + '">&laquo;</a>';
        //
        // for (var i = startPage; i <= endPage; i++)
        // {
        //     if (i == page)
        //         html += '<a href="#" class="active" page="' + i + '">' + i + '</a>';
        //     else
        //         html += '<a href="#" page="' + i + '">' + i + '</a>';
        // }
        //
        // if (nextPage <= pageCnt)
        //     html += '<a href="#" page="' + nextPage + '">&raquo;</a>';
        //
        // $('.pagination').remove();
        // parent.append($(html));
    }

    this.update = function ()
    {
        var page  = this.sheetInfo.currentPage == 0 ? 1 : this.sheetInfo.currentPage;
        var page10 = Math.ceil(page / 10);
        var pageCnt = this.sheetInfo.getPageCount();
        var pageCnt10 = Math.ceil(pageCnt / 10);
        var startPage = 1 + (page10-1) * 10;
        var endPage = (startPage + 9 > pageCnt) ? pageCnt : startPage + 9;

        var prevPage = (page10-1) * 10;
        var nextPage = (page10) * 10 + 1;

        var html = '';

        if (prevPage > 0)
            html += '<a href="#" page="' + prevPage + '">&laquo;</a>';

        for (var i = startPage; i <= endPage; i++)
        {
            if (i == page)
                html += '<a href="#" class="active" page="' + i + '">' + i + '</a>';
            else
                html += '<a href="#" page="' + i + '">' + i + '</a>';
        }

        if (nextPage <= pageCnt)
            html += '<a href="#" page="' + nextPage + '">&raquo;</a>';

        this.container[0].innerHTML = html;
        var contactSheet = this.contactSheet;

        this.container.find('a').on('click', function (e)
        {
            var page = parseInt($(this).attr('page'));
            contactSheet.setPage(page);
        })
    }
}