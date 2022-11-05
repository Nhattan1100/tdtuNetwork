let skip = 0;
let limit = 10;
let skipUser = 0;
let pathArr = window.location.pathname.split('/');

let socket = io("https://tdtu-network.herokuapp.com");
socket.on("server_send_notification", function (data) {
    showToast(data);
});

$(document).ready(function () {
    if (pathArr[1] === 'user') {
        loadUserPost(pathArr[2],skipUser);
    }

    reNewPost();

    loadNotificaitonSidebar();

    if (pathArr[1] === 'allnotification') {
        loadNotificaiton($('#selectNotification').val())
    }

    if (pathArr[1] === 'addnotification' || pathArr[1] === 'editnotification') {
        var notiContent;
        ClassicEditor
            .create(document.querySelector('#editorNotification'), {
                placeholder: 'Nhập nội dung thông báo'
            })
            .then(editor => {
                notiContent = editor;
            })
            .catch(error => {
                console.error(error);
            });
    }

    if(pathArr[1] === 'editnotification'){
        axios.post('/loadnotification',{postId:pathArr[2]})
            .then((response)=>{
                if(response.data.result == 1){
                    $('#txtENotiTittle').val(response.data.data.Tittle);
                    $('#EselectDepartment').val(response.data.data.For);
                    notiContent.setData(response.data.data.content)
                }else{
                    $('.callout h4').text(response.data.errorMsg);
                    $('.callout').removeClass('hide');
                }
            })
    }

    $('.select-categories').selectpicker();

    $('.btn-toggle-sidebar').click(function (event) {
        event.stopPropagation();
        $('.sidebar').css('display', 'block');
    });

    $(window).click(function (e) {
        let container = $('.sidebar');

        // if the target of the click isn't the container nor a descendant of the container
        if (!container.is(e.target) && container.has(e.target).length === 0) {
            container.css('display', 'none');
        }
    });

    $('.rotate').click(function () {
        $(this).toggleClass('down');
        let in1 = $(this).parent().parent().next();
        in1.collapse('toggle');
    });

    $('#imgAvatar').click(function () {
        $('#inputAvatar').trigger('click');
    });

    $('#inputAvatar').change(function () {
        if (this.files[0].size > 5 * 1024 * 1024) {
            alert('Vui lòng chọn file có dung lượng nhỏ hơn 5MB !');
            this.value = '';
        } else {
            readURL(this, $('#imgAvatar'));
        }
    });

    $('#btnAdduser').click(function () {
        $('#formAddUser').validate({
            rules: {
                txtAName: {
                    required: true,
                    minlength: 6,
                },
                txtAUsername: {
                    required: true,
                    minlength: 6,
                },
                txtAPassword: {
                    required: true,
                    minlength: 6,
                }
            },
            messages: {
                txtAName: {
                    required: 'Vui lòng nhập tên phòng khoa !',
                    minlength: 'Tên phòng khoa cần ít nhất 6 kí tự!',
                },
                txtAUsername: {
                    required: 'Vui lòng nhập tên tài khoản !',
                    minlength: 'Tên tài khoản cần ít nhất 6 kí tự!',
                },
                txtAPassword: {
                    required: 'Vui lòng nhập mật khẩu !',
                    minlength: 'Mật khẩu cần ít nhất 6 kí tự!',
                }
            },
            submitHandler: function () {
                if ($('#selectCategories').val().length === 0) {
                    $('#selectValidate').css('display', 'block');
                } else {
                    $('#selectValidate').css('display', 'none');
                    //
                    let newUser = {
                        txtAName: $('#txtAName').val(),
                        txtAUsername: $('#txtAUsername').val(),
                        txtAPassword: $('#txtAPassword').val(),
                        inputAvatar: './images/admin.ico',
                        selectCategories: $('#selectCategories').val(),
                    };
                    // check img
                    uploadImage($('#inputAvatar'), newUser, "inputAvatar", function (user) {
                        axios.post('/adduser', user)
                            .then((response) => {
                                if (response.data.result === 1) {
                                    alert("Thêm tài khoản mới thành công !");
                                    window.location.reload();
                                } else if (response.data.result === 2) {
                                    // user exist
                                } else {
                                    alert("Đã xảy ra lỗi khi thêm tài khoản mới !");
                                    console.log(response.data.errorMsg);
                                    window.location.reload();
                                }
                            });
                    });
                }
            }
        });
    });

    $('#btnChangePassword').click(function () {
        $('#formChangePassword').validate({
            rules: {
                txtCOPassword: {
                    required: true,
                    minlength: 6,
                },
                txtCNPassword: {
                    required: true,
                    minlength: 6,
                },
                txtCRPassword: {
                    required: true,
                    equalTo: '#txtCNPassword',
                }
            },
            messages: {
                txtCOPassword: {
                    required: 'Vui lòng nhập mật khẩu cũ !',
                    minlength: 'Mật khẩu cần ít nhất 6 kí tự!',
                },
                txtCNPassword: {
                    required: 'Vui lòng nhập mật khẩu mới !',
                    minlength: 'Mật khẩu cần ít nhất 6 kí tự!',
                },
                txtCRPassword: {
                    required: 'Vui lòng nhập lại mật khẩu mới !',
                    equalTo: 'Không khớp với mật khẩu mới !',
                }
            },
            submitHandler: function () {
                axios.post('/changepassword', {
                    txtCOPassword: $('#txtCOPassword').val(),
                    txtCNPassword: $('#txtCNPassword').val()
                }).then(function (response) {
                    if (response.data.result === 0) {
                        $('.callout-danger').removeClass('hide');
                        $('.callout-danger h4').text(response.data.errorMsg);
                    }
                    if (response.data.result === -1) {
                        alert(response.data.errorMsg);
                        window.location = '/logout';
                    } else {
                        alert('Cập nhật mật khẩu thành công !');
                        window.location = '/';
                    }
                });
            }
        });
    });

    $('#btnChangeInformation').click(function () {
        $('#formChangeInformation').validate({
            rules: {
                txtCName: {
                    required: true,
                    minlength: 6,
                },
                txtCClass: {
                    minlength: 8,
                    maxlength: 8
                },
                txtCFacility: {
                    minlength: 6,
                }
            },
            messages: {
                txtCName: {
                    required: 'Vui lòng nhập tên hiển thị !',
                    minlength: 'Tên hiển thị cần ít nhất 6 kí tự!',
                },
                txtCClass: {
                    minlength: 'Tên tài khoản gồm 8 kí tự!',
                    maxlength: 'Tên tài khoản gồm 8 kí tự!',
                },
                txtCFacility: {
                    minlength: 'Tên khoa cần ít nhất 6 kí tự!',
                }
            },
            submitHandler: function () {
                let updateUser = {
                    txtCName: $('#txtCName').val(),
                    txtCClass: $('#txtCClass').val(),
                    txtCFacility: $('#txtCFacility').val(),
                    inputAvatar: $('#imgAvatar').attr('src')
                };
                // check img
                uploadImage($('#inputAvatar'), updateUser, "inputAvatar", function (user) {
                    axios.post('/changeinformation', user)
                        .then((response) => {
                            if (response.data.result === 1) {
                                alert("Cập nhật thông tin thành công !");
                                window.location = '/';
                            } else if (response.data.result === -1) {
                                alert(response.data.errorMsg);
                                window.location = '/logout';
                            } else {
                                $('.callout-danger').removeClass('hide');
                                $('.callout-danger h4').text(response.data.errorMsg);
                            }
                        });
                });
            }
        });
    });

    $('#textPost').on('input', function () {
        this.style.height = 'auto';

        this.style.height =
            (this.scrollHeight) + 'px';
        checkBtnPost($('#btnPost'), $('#textPost'), $('#imgPost'), $('#iframeYoutube'));

    });

    $('#btnPostPopUp').click(function () {
        $('.popup-post').removeClass('hide');
        $('.post-wrapper').addClass('blur');
        checkBtnPost($('#btnPost'), $('#textPost'), $('#inputPostImage'), $('#iframeYoutube'));
    })

    $('#btnClose').click(function () {
        $('.popup-post').addClass('hide');
        $('.post-wrapper').removeClass('blur');
        $('#textPost').val('');
        $('#btnDelImage').trigger('click');
        $('#btnDelVideo').trigger('click');
    });

    $('#btnCloseComment').click(function () {
        $('.popup-comment').addClass('hide');
        $('.post-wrapper').removeClass('blur');
        $('#inputEditComment').val('');
    });

    $('#btnAddImage').click(function () {
        $('#inputPostImage').trigger('click');
    });

    $('#inputPostImage').change(function () {
        readURL(this, $('#imgPost'));
        $('#btnAddImage').addClass('hide');
        $('#btnDelImage').removeClass('hide');
        checkBtnPost($('#btnPost'), $('#textPost'), $('#inputPostImage'), $('#iframeYoutube'));

    });

    $('#btnDelImage').click(function () {
        $('#btnAddImage').removeClass('hide');
        $('#btnDelImage').addClass('hide');
        $('#imgPost').attr('src', '');
        $('#inputPostImage').val('');
        $('#videoYoutube').val('');
        checkBtnPost($('#btnPost'), $('#textPost'), $('#inputPostImage'), $('#iframeYoutube'));

    });

    $('#btnVideoOK').click(function () {
        let idYoutube = getYoutubeID($('#inputYURL').val());
        if (idYoutube != null) {
            emYoutube = 'https://youtube.com/embed/' + idYoutube;
            $('#iframeYoutube').attr('src', emYoutube);
            $('#btnVideoToggle').addClass('hide');
            $('#btnDelVideo').removeClass('hide');
            $('#inputYURL').val('');
            $('#videoYoutube').val(emYoutube);
            $('#btnVideoToggle').trigger('click');
            $('#iframeYoutube').removeClass('hide');
            checkBtnPost($('#btnPost'), $('#textPost'), $('#inputPostImage'), $('#iframeYoutube'));
        }
    });

    $('#btnDelVideo').click(function () {
        $('#iframeYoutube').attr('src', '');
        $('#btnVideoToggle').removeClass('hide');
        $('#btnDelVideo').addClass('hide');
        $('#iframeYoutube').addClass('hide');
        checkBtnPost($('#btnPost'), $('#textPost'), $('#inputPostImage'), $('#iframeYoutube'));

    });

    $('#btnPost').click(function () {
        let newPost = {
            contentFull: $('#textPost').val(),
            contentImage: '',
            contentVideoId: $('#videoYoutube').val()
        };
        // check img
        uploadImage($('#inputPostImage'), newPost, "contentImage", function (post) {
            axios.post('/addpost', post)
                .then((response) => {
                    if (response.data.result === 1) {
                        //append new post
                        $('#loadTopPost').removeClass('hide');
                        $('#btnClose').trigger('click');
                        if (pathArr[1] === 'user') {
                            loadUserPost(pathArr[2],0);
                        } else {
                            reNewPost();
                        }
                        $('#loadTopPost').addClass('hide');
                    } else {
                        alert(response.data.errorMsg);
                        window.location.reload();
                    }
                });
        });

    });

    $('#btnRefresh').click(function () {
        if (pathArr[1] === 'user') {
            $(this).addClass('hide');
            $('#loadTopPost').removeClass('hide');
            loadUserPost(pathArr[2],0);
        } else {
            $(this).addClass('hide');
            $('#loadTopPost').removeClass('hide');
            reNewPost();
            $('#loadTopPost').addClass('hide');
        }
    });

    $('#btnLoadmore').click(function () {
        $(this).addClass('hide');
        $('#loadBottomPost').removeClass('hide');
        loadNewPost(skip, limit);
        $('#loadBottomPost').addClass('hide');
    });

    $('#btnEdit').click(function () {
        let newPost = {
            postId: $('#postId').val(),
            contentFull: $('#textPost').val(),
            contentImage: '',
            contentVideoId: $('#videoYoutube').val()
        };
        uploadImage($('#inputPostImage'), newPost, "contentImage", function (post) {
            axios.post('/editpost', post)
                .then((response) => {
                    if (response.data.result === 1) {
                        //append new post
                        $('#loadTopPost').removeClass('hide');
                        $('#btnClose').trigger('click');
                        if (pathArr[1] === 'user') {
                            loadUserPost(pathArr[2]);
                        } else {
                            reNewPost();
                        }
                        $('#loadTopPost').addClass('hide');
                    } else {
                        alert(response.data.errorMsg);
                        window.location.reload();
                    }
                });
        });

    });

    $('#btnEditComment').click(function () {
        let content = $('#inputEditComment').val();
        let idArr = $('#id').val().split('_');
        let userId = idArr[1];
        let commentId = idArr[2];
        let postId = idArr[3];
        let ownerId = idArr[4];

        axios.post('/editcomment', {content: content, commentId: commentId})
            .then((response) => {
                if (response.data.result == 1) {
                    $('#btnCloseComment').trigger('click');
                    loadComment(postId, ownerId);
                } else {
                    alert(response.data.errorMsg);
                }
            });
    });

    $('#btnAddNotification').click(function () {
        let newNoti = {
            content: notiContent.getData(),
            Tittle: $('#txtNotiTittle').val(),
            For: $('#selectDepartment').val(),
        }
        axios.post('/addnotification', {Noti: newNoti})
            .then((response) => {
                if (response.data.result == 1) {
                    //bat su kien emit here
                    socket.emit("user_send_notification", {
                        Data: response.data.data
                    });
                    window.location = '/allnotification'
                } else {
                    alert(response.data.errorMsg);
                    window.location.reload();
                }
            })
    });

    $('#btnEditNotification').click(function () {
        let newNoti = {
            content: notiContent.getData(),
            Tittle: $('#txtENotiTittle').val(),
            For: $('#EselectDepartment').val(),
            NotiId: pathArr[2]
        }
        axios.post('/editnotification', {Noti: newNoti})
            .then((response) => {
                if (response.data.result == 1) {
                    window.location = '/allnotification'
                } else {
                    alert(response.data.errorMsg);
                    window.location.reload();
                }
            })
    });

    $('#selectNotification').change(function () {
        console.log($(this).val())
        loadNotificaiton($(this).val());
    });

    $(document).on('click', '.read-more', function () {
        $(this).addClass('hide');
        $(this).next().removeClass('hide');
    })

    $(document).on('click', '.btn-comment', function () {
        let id = $(this).attr('id');
        let idArr = id.split('_');
        let userId = idArr[1];
        let postId = idArr[2];
        loadComment(postId, userId);
        $('.' + id).toggle();

    });

    $(document).on('click', '.deletepost', function () {
        let id = $(this).attr('id');
        let idArr = id.split('_');
        let userId = idArr[1];
        let postId = idArr[2];
        axios.post('/deletepost', {postId: postId, userId: userId})
            .then((response) => {
                if (response.data.result === 1) {
                    if (pathArr[1] === 'user') {
                        loadUserPost(pathArr[2]);
                    } else {
                        reNewPost();
                    }
                } else {
                    alert(response.data.errorMsg);
                    window.location.reload();
                }
            });
    });

    $(document).on('click', '.editpost', function () {
        let id = $(this).attr('id');
        let idArr = id.split('_');
        let userId = idArr[1];
        let postId = idArr[2];

        axios.post('/getpost', {postId: postId, userId: userId})
            .then((response) => {
                if (response.data.result == 1) {
                    $('.popup-post').removeClass('hide');
                    $('#textPost').val(response.data.data.content.First + response.data.data.content.Last);
                    if (response.data.data.content.Image != '') {
                        $('#imgPost').attr('src', response.data.data.content.Image);
                        $('#btnAddImage').addClass('hide');
                        $('#btnDelImage').removeClass('hide');
                    }
                    if (response.data.data.content.VideoId != '') {
                        $('#iframeYoutube').attr('src', response.data.data.content.VideoId);
                        $('#btnVideoToggle').addClass('hide');
                        $('#btnDelVideo').removeClass('hide');
                        $('#videoYoutube').val(response.data.data.content.VideoId);
                        $('#iframeYoutube').removeClass('hide');
                    }
                    $('#postId').val(postId);
                    $('#postTittle').text('Chỉnh sửa bài viết');
                    $('#btnPost').addClass('hide');
                    $('#btnEdit').removeClass('hide');
                    $('.post-wrapper').addClass('blur');
                } else {
                    alert(response.data.errorMsg);
                }
            })
    });

    $(document).on('click', '.comment', function () {
        let id = $(this).attr('id');
        let idArr = id.split('_');
        let userId = idArr[1];
        let postId = idArr[2];
        let ownerID = idArr[3];
        let inputID = 'inputComment_' + userId + '_' + postId;
        let content = $('.' + inputID).val();
        if (content.length != 0) {
            axios.post('/addcomment', {
                userId: ownerID,
                postId: postId,
                content: content,
            }).then((response) => {
                if (response.data.result == 1) {
                    $('.' + inputID).val('');
                    loadComment(postId, userId);
                } else {
                    alert(response.data.errorMsg);
                }
            });
        }
    });

    $(document).on('click', '.deletecomment', function () {
        let id = $(this).attr('id');
        let idArr = id.split('_');
        let userId = idArr[1];
        let commentId = idArr[2];
        let postId = idArr[3];
        let owerID = idArr[4];

        axios.post('/deletecomment', {commentId: commentId, userId: userId})
            .then((response) => {
                if (response.data.result === 1) {
                    loadComment(postId, owerID);
                } else {
                    alert(response.data.errorMsg);
                    window.location.reload();
                }
            });
    });

    $(document).on('click', '.editcomment', function () {
        let id = $(this).attr('id');
        let idArr = id.split('_');
        let userId = idArr[1];
        let commentId = idArr[2];
        let postId = idArr[3];
        let owerID = idArr[4];

        axios.post('/getcomment', {commentId: commentId, userId: userId})
            .then((response) => {
                if (response.data.result == 1) {
                    $('.popup-comment').removeClass('hide');
                    $('#id').val('editcommentcontent_' + userId + '_' + commentId + '_' + postId + '_' + owerID);
                    $('#inputEditComment').val(response.data.data.content);
                    $('.post-wrapper').addClass('blur');

                } else {
                    alert(response.data.errorMsg);
                }
            })
    });

    $(document).on('click', '.btnlike', function () {
        let id = $(this).attr('id');
        let idArr = id.split('_');
        let action = idArr[0]
        let userId = idArr[1];
        let postId = idArr[2];

        if (action == 'likePost') {
            axios.post('/like', {postId: postId, userId: userId})
                .then((response) => {
                    if (response.data.result == 1) {
                        $(this).addClass('liked');
                        $(this).attr('id', 'dislikePost_' + userId + '_' + postId);
                    }
                })
        } else {
            axios.post('/dislike', {postId: postId, userId: userId})
                .then((response) => {
                    if (response.data.result == 1) {
                        $(this).attr('id', 'likePost_' + userId + '_' + postId);
                        $(this).removeClass('liked');
                    }
                })

        }
    });

    $(document).on('click','.deletenotification',function () {
        let id = $(this).attr('id');
        let idArr = id.split('_');
        let ownerId = idArr[1];
        let notiId = idArr[2];
        let userId = idArr[3];

        axios.post('/deletenotiication', {notiId: notiId, userId: userId})
            .then((response) => {
                if (response.data.result === 1) {
                    loadNotificaiton($('#selectNotification').val());
                } else {
                    alert(response.data.errorMsg);
                    window.location.reload();
                }
            });
    })

    $(document).on('click','.editnotification',function () {
        let id = $(this).attr('id');
        let idArr = id.split('_');
        let ownerId = idArr[1];
        let notiId = idArr[2];
        let userId = idArr[3];
        let redirectPath = '/editnotification/'+notiId;

        window.location = redirectPath;

    })

    $(window).scroll(function () {
        if ($(window).scrollTop() + $(window).height() >= $(document).height()) {

            if (pathArr[1] === 'user') {
                $('#loadBottomPost').removeClass('invisible')
                loadUserPost(pathArr[2],skipUser);
            } else {
                $('#loadBottomPost').removeClass('invisible')
                loadNewPost(skip, limit);
            }

        }
        if ($(window).scrollTop() === 0) {
            $('#btnRefresh').removeClass('hide')
        }
    });

});

function isImage(input) {
    if (input.get(0).files.length === 0) {
        return false;
    }
    return true;
}

function uploadImage(input, newUser, param, callback) {
    if (isImage(input)) {
        let imgData = new FormData();
        $.each(input[0].files, function (i, file) {
            imgData.append("file-" + i, file);
        });
        axios.post('/uploadimage', imgData)
            .then((response) => {
                if (response.data.result === 1) {
                    // newUser[param] = './images/upload/resized/' + response.data.file;
                    newUser[param] =response.data.file;
                    console.log(response.data.file);
                    return callback(newUser);
                } else {
                    alert('Đã xảy ra lỗi khi upload hình !');
                    console.log(response.data.errorMsg);
                    return callback(newUser);
                }
            });
    } else {
        return callback(newUser);
    }
}

function readURL(input, imgHolder) {
    if (input.files && input.files[0]) {
        let reader = new FileReader();

        reader.onload = function (e) {
            imgHolder.attr('src', e.target.result);
        }

        reader.readAsDataURL(input.files[0]); // convert to base64 string
    }
}

function getYoutubeID(url) {
    let regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    let match = url.match(regExp);
    if (match && match[7].length == 11) {
        let id = match[7];
        return id;
    } else {
        return null;
    }
}

function checkBtnPost(target, input1, input2, input3) {
    if (input1.val() != '' || input2.val() != '' || input3.attr('src') != '') {
        target.removeClass('not-allow').addClass('btn-primary').removeAttr("disabled", 'disabled');
    } else {
        target.addClass('not-allow').removeClass('btn-primary').attr("disabled", 'disabled');
    }
}

function appendPost(target, data, user, like) {
    let hideMedia = '';
    let isOwner = 'hide';
    let hideImage = '';
    let hideVideo = '';
    let hideReadmore = '';
    let isLiked = 'likePost';
    let likeStatus = '';

    if (data.content.Image == '' && data.content.Video == '') {
        hideMedia = 'hide';
    }
    if (data.user._id == user._id || user.userGroup == 0) {
        isOwner = '';
    }
    if (data.content.Image == '') {
        hideImage = 'hide';
    }
    if (data.content.VideoId == '') {
        hideVideo = 'hide';
    }
    if (data.content.Last == '') {
        hideReadmore = 'hide';
    }

    if (like.length != 0) {
        if (like[0].userId == user._id) {
            isLiked = 'dislikePost'
            likeStatus = 'liked'
        }
    }

    target.append(`
        <div class="main">
            <div class="row">
                <div class=" col-3 col-lg-1">
                    <img src="` + data.user.Image + `" class="img-circle-post" alt="">
                </div>
                <div class="col-9 col-lg-11">
                    <div class="row">
                        <div class="col-10 col-lg-11">
                            <div class="'row">
                                <a href="/user/` + data.user._id + `" class="post-owner">` + data.user.Name + `</a>
                            </div>
                            <div class="row">
                                <span class="post-time">` + timeSince(data.Date) + `</span>
                            </div>
                        </div>
                         <div class="col-2 col-lg-1 ` + isOwner + `">
                            <div class="btn-group ">
                                <button type="button" class="btn btn-secondary btn-edit" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <div class="dropdown-menu dropdown-menu-right">
                                    <button class="dropdown-item deletepost" id="deletePost_` + data.user._id + `_` + data._id + `">Xoá bài</button>
                                    <button class="dropdown-item editpost" id="editPost_` + data.user._id + `_` + data._id + `">Sửa bài</button>
                                </div>
                            </div>
                         </div>
                    </div>

                </div>
            </div>
            <div class="row">
                <div class="col-12 col-lg-12 post-main">
                    <div class="form">
                        <div class="post-content">
                            <div><span>` + data.content.First + `</span>
                                 <span class="read-more ` + hideReadmore + `">Xem thêm</span>
                                <span class="hide last-content">` + data.content.Last + `</span>
                            </div>
                            <div class="media-holder ` + hideMedia + `">
                                <img src="` + data.content.Image + `" class="gallery ` + hideImage + `" alt="">
                                <iframe src="` + data.content.VideoId + `" class="` + hideVideo + `"></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="like-comment">
                    <div class="row">
                        <div class="col-6 col-md-6">
                            <button id="` + isLiked + `_` + user._id + `_` + data._id + `" class="btn-like-comment btnlike ` + likeStatus + `"><i class="far fa-thumbs-up"></i> Thích</button>
                        </div>
                        <div class=" col-6 col-md-6">
                            <button class="btn-like-comment btn-comment" id="commentContainer_` + data.user._id + `_` + data._id + `"><i class="far fa-comment-dots"></i> Bình luận
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="commentContainer_` + data.user._id + `_` + data._id + ` row collapse-container" id="` + data._id + `">
                <div class="collapse-content">
                    <div class="row input-comment">
                        <div class="col-2 col-md-1 col-lg-1">
                             <img src="` + user.Image + `" class="imgComment_` + user._id + `_` + data._id + ` img-circle-post" alt="">
                        </div>
                        <div class="col-8 col-md-9 col-lg-10">
                             <input class="inputComment_` + data.user._id + `_` + data._id + `" type="text" placeholder="Viết bình luận ...">
                        </div>
                        <div class="col-2 col-md-2 col-lg-1">
                            <button id="postComment_` + data.user._id + `_` + data._id + `_` + user._id + `" class="btn-primary comment"><i class="far fa-paper-plane"></i> Gửi</button>
                        </div>
                    </div>
                    <div class="comment-contain commentContain_` + data.user._id + `_` + data._id + `" id="comment-contain commentContain_` + data.user._id + `_` + data._id + `">
                    </div>
                </div>
            </div>
        </div>
    `);
}

function appendComment(target, data, user, ownerId) {
    let isOwner = 'hide';

    if (data.user._id == user._id || user.userGroup == 0) {
        isOwner = '';
    }

    target.append(`                                
        <div class="row">
            <div class="col-2 col-md-1 col-lg-1 ">
                <img src="` + data.user.Image + `" class="img-circle-post" alt="">
            </div>
            <div class="col-10 col-md-11 col-lg-11 ">
                <a href="/user/` + data.user._id + `" class="comment-name">` + data.user.Name + `</a> <span class="comment-time">` + timeSince(data.Date) + `</span>
                <div>` + data.content + `</div>
                <div class="btn-group ` + isOwner + ` ">
                    <button type="button" class="btn btn-secondary btn-edit" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="dropdown-menu dropdown-menu-right">
                        <button class="dropdown-item deletecomment" id="deletecomment_` + data.user._id + `_` + data._id + `_` + data.post + `_` + ownerId + `" >Xoá bình luận</button>
                        <button class="dropdown-item editcomment" id="editcomment_` + data.user._id + `_` + data._id + `_` + data.post + `_` + ownerId + `">Sửa bình luận</button>
                    </div>
                </div>
            </div>
        </div>
    `);
}

function appendNotificationSidebar(target, data) {
    target.append(`
        <div class="notification-item">
            <a class="item" href="/notification/` + data._id + `">
                <div class="notification-holder"> <span class="name">` + data.user.Name + ` </span><span class="time">- ` + timeSince(data.Date) + `</span></div>
                <span class="tittle">` + data.Tittle + `</span>
            </a>
        </div>
    `);
}

function appendNotification(target, data, user) {
    let isOwner = 'hide';

    if (data.user._id == user._id || user.userGroup == 0) {
        isOwner = '';
    }

    target.append(`
        <div class="notification-item">
            <a href="/notification/` + data._id + `" class="notification-holder">
                <div class="tittle">` + data.Tittle + `</div>
                <div class="info"><span class="for">` + data.For + `</span> - <span class="time">` + timeSince(data.Date) + `</span></div>
            </a>
            <div class="btn-group ` + isOwner + ` ">
                <button type="button" class="btn btn-secondary btn-edit" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="dropdown-menu dropdown-menu-right">
                    <button class="dropdown-item deletenotification" id="deletenotification_` + data.user._id + `_` + data._id + `_` + user._id + `" >Xoá thông báo</button>
                    <button class="dropdown-item editnotification" id="editnotification_` + data.user._id + `_` + data._id + `_` + user._id + `">Sửa thông báo</button>
                </div>
            </div>
        </div>
    `);
}

function timeSince(date) {

    let seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;

    if (interval > 1) {
        return Math.floor(interval) + " năm trước";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + " tháng trước";
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + " ngày trước";
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + " giờ trước";
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " phút trước";
    }
    return Math.floor(seconds) + " giây trước";
}

function loadNewPost(skipold, limitold) {
    skip = 0 + limitold;
    limit = limitold + 10;
    axios.post('/loadpost', {skip: skipold, limit: limitold})
        .then((response) => {
            if (response.data.result === 1) {
                asyncForEach(response.data.data, async (post) => {
                    let user = response.data.user;
                    await axios.post('/loadlike', {postId: post._id})
                        .then((response) => {
                            if (response.data.result == 1) {
                                appendPost($('.newsfeed-post'), post, user, response.data.data);
                            }
                        });
                })
                $('#loadBottomPost').addClass('invisible');
            } else {
                if (response.data.result === -1) {
                } else {
                    alert(response.data.errorMsg);
                }
            }
        });
}

function reNewPost() {
    skip = 0;
    limit = 10;
    axios.post('/loadpost', {skip: skip, limit: limit})
        .then((response) => {
            if (response.data.result === 1) {
                $('.newsfeed-post').empty();
                asyncForEach(response.data.data, async (post) => {
                    let user = response.data.user;
                    await axios.post('/loadlike', {postId: post._id})
                        .then((response) => {
                            if (response.data.result == 1) {
                                appendPost($('.newsfeed-post'), post, user, response.data.data);
                            }
                        });
                })
                $('#loadBottomPost').addClass('invisible');
                skip = 10;
                limit = 20;
            } else {
                alert(response.data.errorMsg);
            }
        })
        .catch((err) => {
            console.log(err);
        });
}

function loadComment(postId, userId) {
    let commentContainer = 'commentContain_' + userId + '_' + postId;
    axios.post('/loadcomment', {postId: postId})
        .then((response) => {
            if (response.data.result === 1) {
                $('.' + commentContainer).empty();
                response.data.data.forEach(function (comment) {
                    appendComment($('.' + commentContainer), comment, response.data.user, userId);
                });

            } else {
                alert(response.data.errorMsg);
            }
        })
        .catch((err) => {
            console.log(err);
        });
}

function loadUserPost(userId,skip) {
    axios.post('/loaduserpost', {userId: userId, skip: skip})
        .then((response) => {
            if (response.data.result === 1) {
                if(skip == 0){
                    $('.userfeed-post').empty();
                }
                asyncForEach(response.data.data, async (post) => {
                    let user = response.data.user;
                    await axios.post('/loadlike', {postId: post._id})
                        .then((response) => {
                            if (response.data.result == 1) {
                                appendPost($('.userfeed-post'), post, user, response.data.data);
                            }
                        });
                })
                $('#loadBottomPost').addClass('invisible');
                skipUser = skip+ 10;
            } else {
                alert(response.data.errorMsg);
            }
        })
        .catch((err) => {
            console.log(err);
        });
}

function loadNotificaitonSidebar() {
    axios.post('/loadnotification', {Sidebar: 1})
        .then((response) => {
            if (response.data.result === 1) {
                $('.notification-body').empty();
                response.data.data.forEach(function (noti) {
                    appendNotificationSidebar($('.notification-body'), noti);
                });

            } else {
                alert(response.data.errorMsg);
            }
        })
        .catch((err) => {
            console.log(err);
        });
}

function showToast(data) {
    document.getElementById("noti-owner").innerHTML = data.name;
    document.getElementById("noti-tittle").innerHTML = data.tittle;
    document.getElementById("noti-time").innerHTML = timeSince(data.time);
    let x = document.getElementById("snackbar");
    x.className = "show";
    setTimeout(function () {
        x.className = x.className.replace("show", "");
        loadNotificaitonSidebar();
    }, 10000);
}

function loadNotificaiton(For) {
    axios.post('/loadnotification', {For: For})
        .then((response) => {
            if (response.data.result === 1) {
                $('#notificationContainer').empty();
                response.data.data.forEach(function (noti) {
                    appendNotification($('#notificationContainer'), noti, response.data.user);
                });
                notificationPagegination('allnotification')
            } else {
                alert(response.data.errorMsg);
            }
        })
        .catch((err) => {
            console.log(err);
        });
}

function notificationPagegination(path) {
    let items = $("#notificationContainer .notification-item");
    let numItems = items.length;
    let perPage = 10;


    items.slice(perPage).hide();

    $('#pagination-container').pagination({
        items: numItems,
        itemsOnPage: perPage,
        prevText: "&laquo;",
        nextText: "&raquo;",
        hrefTextPrefix: '/' + path + '/#page-',
        onPageClick: function (pageNumber) {
            let showFrom = perPage * (pageNumber - 1);
            let showTo = showFrom + perPage;
            items.hide().slice(showFrom, showTo).show();
        }
    });

}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}
