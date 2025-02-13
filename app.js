const cl = console.log;



let BASE_URL = `https://post-3b130-default-rtdb.firebaseio.com`
let POST_URL = `${BASE_URL}/posts.json`

let postForm = document.getElementById("postForm");
let title = document.getElementById("title");
let content = document.getElementById("content");
let userId = document.getElementById("userId");

let submitBtn = document.getElementById("submitBtn");
let updateBtn = document.getElementById("updateBtn");
let cancelBtn = document.getElementById("cancelBtn");

let scrollTop = document.getElementById("scrollTop");
let loader = document.getElementById("loader");
let showPost = document.getElementById("showPost");

// let loader = document.getElementById("loader");
// let loader = document.getElementById("loader");

let snakeBar = (msg,icon)=>{
    Swal.fire({
        title : msg,
        icon : icon,
        timer : 5000
    })
}

let onCancelBtn = () => {
    postForm.reset();
    submitBtn.classList.remove('d-none')
    updateBtn.classList.add('d-none')
}
cancelBtn.addEventListener("click", onCancelBtn)

let handleFormBtn = (value)=>{
    if(value){
        submitBtn.classList.add('d-none')
        updateBtn.classList.remove('d-none')
    }else{
        submitBtn.classList.remove('d-none')
        updateBtn.classList.add('d-none')
    }
} 

let createCard =(obj, id)=>{
    let card = document.createElement("div")
    card.classList.add("card", "mb-3")
    card.id = id.name
    card.innerHTML = `
            <div class="card-header">${obj.title}</div>
            <div class="card-body">${obj.content}</div>
            <div class="card-footer d-flex justify-content-between">
            <button class="btn btn-success" onclick="onEdit(this)">Edit</button>
            <button class="btn btn-danger" onclick="onRemove(this)">Remove</button>
            </div>
    `
    showPost.append(card)

}

window.addEventListener("scroll", ()=>{
    if(scrollY > 250){
        scrollTop.classList.remove('d-none');
    }else{
        scrollTop.classList.add('d-none');
    }
})

let scrollToTop = () =>{
    scrollTo({
        top:0,
        behavior:'smooth'
    })
}
scrollTop.addEventListener("click", scrollToTop)

let templating = (arr)=>{
    result = ``
    arr.forEach(e=>{
        result+=`
        <div class="card mb-3" id="${e.id}">
          <div class="card-header">${e.title}</div>
          <div class="card-body">${e.content}</div>
          <div class="card-footer d-flex justify-content-between">
            <button class="btn btn-success" onclick="onEdit(this)">Edit</button>
            <button class="btn btn-danger" onclick="onRemove(this)">Remove</button>
          </div>
        </div>
        `
    })
    showPost.innerHTML = result
}

let makeApiCall = (method, url, data)=>{
    loader.classList.remove("d-none")
    return new Promise((resolve,reject)=>{
        let xhr = new XMLHttpRequest()
        xhr.open(method,url)
        xhr.setRequestHeader("content-type",'Application/JSON')
        xhr.setRequestHeader("authorization",'JWT_ACCESS_TOKEN FROM_LOCAL_STORAGE')
        xhr.send(data? JSON.stringify(data) : null)
        xhr.onload = function(){
            if(xhr.status > 199 && xhr.status < 300){
                let data = JSON.parse(xhr.response)
                resolve(data)
                loader.classList.add('d-none')
            }else{
                loader.classList.add('d-none')
                reject(xhr.status)                
            }
        }
    })
}

let fetchAllData = ()=>{
    makeApiCall('GET',POST_URL)
    .then(resolve=>{
        let postArr = Object.keys(resolve).map(e=>({...resolve[e],id:e}))
        templating(postArr)
    })
    .catch(err=>{
        snakeBar(err,'error')
    })
}
fetchAllData()

let onSubmit = (eve)=>{
    eve.preventDefault()
    let newPost = {
        title : title.value,
        content : content.value,
        userId : userId.value,
    }
    postForm.reset()    
    makeApiCall("POST",POST_URL, newPost)
        .then(resolve=>{         
            createCard(newPost, resolve)
            snakeBar("Post Added SuccessFully",'success')
        })
        .catch(err=>{
            snakeBar(err,'error')
        })
}
postForm.addEventListener("submit", onSubmit);


let onEdit = (eve)=>{
    let EDIT_ID = eve.closest(".card").id
    let edit_url = `${BASE_URL}/posts/${EDIT_ID}.json`
    localStorage.setItem("EDIT_ID", EDIT_ID)
    loader.classList.remove('d-none')
    makeApiCall("GET", edit_url)
    .then(resolve=>{
        title.value = resolve.title
        content.value = resolve.content
        userId.value = resolve.userId
        localStorage.setItem("EditTitle",resolve.title)
        loader.classList.add('d-none')
        scrollToTop()
        handleFormBtn(true)
    })
    .catch(err=>{
        snakeBar(err,'error')
        loader.classList.add('d-none')
    })
}

let onUpdate = (eve) =>{
    loader.classList.remove('d-none')
    let updateId = localStorage.getItem('EDIT_ID')
    let updateUrl = `${BASE_URL}/posts/${updateId}.json`
    let updateObj ={
        title : title.value,
        content : content.value,
        userId : userId.value,
    }
    makeApiCall("PATCH", updateUrl, updateObj)
    .then(resolve=>{
        let cardChild = document.getElementById(updateId).children
        cardChild[0].innerHTML= resolve.title
        cardChild[1].innerHTML= resolve.content
        handleFormBtn()
        postForm.reset()
        let editTitle = localStorage.getItem("EditTitle")
        snakeBar(`Post ${editTitle} is Updated to ${resolve.title} Successfully`,'success')
    })
    .catch(err=>{
        snakeBar(err,'error')
        loader.classList.add('d-none')
    })
}
updateBtn.addEventListener("click", onUpdate)

let onRemove =(eve)=>{
    let removeId = eve.closest('.card').id
    let removeTitle = eve.closest('.card').children[0].innerText
    let REMOVE_URL = `${BASE_URL}/posts/${removeId}.json`
    console.log(removeTitle);

    Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!"
        })
        .then((result) => {
            if (result.isConfirmed) {
              return makeApiCall("DELETE", REMOVE_URL); // Return the API call promise
            } else {
              throw new Error("User cancelled the action");
            }
          })
          .then((response) => {
            document.getElementById(removeId).remove()
            snakeBar(`Post ${removeTitle} is Deleted Successfully`, 'success')
          })
          .catch(err=>{
            snakeBar(err,"error")
            loader.classList.add('d-none')
        })
    }