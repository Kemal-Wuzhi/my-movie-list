const BASE_URL = 'https://movie-list.alphacamp.io'
const INDEX_URL = BASE_URL + '/api/v1/movies/'
const POSTER_URL = BASE_URL + '/posters/'
const movies = []
const dataPanel = document.querySelector('#data-panel')
const MOVIES_PER_PAGE = 12
let filteredMovies = []

//傳統利用 for 迴圈 拿取 indx.api中物件的方法
// axios.get(INDEX_URL)
//   .then((response) => {
//     for (const movie of response.data.results) {
//       movies.push(movie)
//     }
//     console.log(movies)
//   }).catch((err) => console.log(err))
const searchForm = document.querySelector("#search-form")
const searchInput = document.querySelector("#search-input")

//設計一個新增我的最愛電影的函式，將id傳入時，會把電影存進localsStorage
//下面這段是我比較不懂的部分，要再加強複習
function addToFavorite(id) {
  const list = JSON.parse(localStorage.getItem('favoriteMovies')) || []
  const movie = movies.find((movie) => movie.id === id) //尋找在movies中是否有符合id的電影
  if (list.some((movie) => movie.id === id)) {
    return alert('此電影已經在收藏清單中！')
  }
  list.push(movie) //將電影放進list清單中
  localStorage.setItem('favoriteMovies', JSON.stringify(list))
}

//將監聽器綁在欲觸發的子元素.btn-show-movie的父元素dataPanel上，再利用target.matches來去抓取子元素btn-show-movie
dataPanel.addEventListener('click', function onPanelClicked(event) {
  if (event.target.matches('.btn-show-movie')) {
    showMovieModal(Number(event.target.dataset.id))
  } else if (event.target.matches('.btn-add-favorite')) {
    addToFavorite(Number(event.target.dataset.id))
  }
})

//利用 renderMovieList function 將 80 部電影一部一部透過 forEach 放進 rawHTML 這個變數中，最後再渲染一次
//不直接在這裡把 movies 寫死在函式中，而是先寫好函式的邏輯，之後再在上面的 axios 中呼叫renderMovieList 函式，
//並且把 movies 傳入 renderMovieList，讓 renderMovieList 執行其功能，把 movies 中的 80 部電影一個個 forEach 進來
function renderMovieList(data) {
  let rawHTML = ''
  data.forEach((item) => {
    // title, image
    rawHTML += `<div class="col-sm-3">
    <div class="mb-2">
      <div class="card">
        <img src="${
          POSTER_URL + item.image
        }" class="card-img-top" alt="Movie Poster">
        <div class="card-body">
          <h5 class="card-title">${item.title}</h5>
        </div>
        <div class="card-footer">
          <button class="btn btn-primary btn-show-movie" data-toggle="modal" data-target="#movie-modal" data-id="${item.id}">More</button>
          <button class="btn btn-info btn-add-favorite" data-id="${item.id}">+</button>
        </div>
      </div>
    </div>
  </div>`
  })
  dataPanel.innerHTML = rawHTML
}

function showMovieModal(id) {
  const modalTitle = document.querySelector('#movie-modal-title')
  const modalImage = document.querySelector('#movie-modal-image')
  const modalDate = document.querySelector('#movie-modal-date')
  const modalDescription = document.querySelector('#movie-modal-description')

  axios.get(INDEX_URL + id).then((response) => {
    const data = response.data.results
    modalTitle.innerText = data.title
    modalDate.innerText = 'Release date: ' + data.release_date
    modalDescription.innerText = data.description
    modalImage.innerHTML = `<img src="${
      POSTER_URL + data.image
    }" alt="movie-poster" class="img-fluid">`
  })
}

searchForm.addEventListener('submit', function onSearchFormSubmitted(event) {
  event.preventDefault() //防止瀏覽器依照預設的行為刷新頁面
  console.log('click!') //測試用
  const keyword = searchInput.value.trim().toLowerCase() //抓取searchInput的值，並且去掉空格和大小寫的區分
  if (!keyword.length) { //沒有辦法計算輸入值時，跳出警告提醒
    return alert('請輸入有效字串！')
  }
  //搜尋功能中篩選字串的兩種做法
  //作法1 利用for迴圈
  // for (const movie of movies) {
  //   if (movie.title.toLowerCase().includes(keyword)) {
  //     filteredMovies.push(movie)
  //   }
  // }
  //作法2 利用filter來篩選。filter需要一個函式來做為條件，只有滿足該函式的值才會被取出
  filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(keyword)
  )
  //錯誤處理：無符合條件的結果
  if (filteredMovies.length === 0) {
    return alert(`您輸入的關鍵字：${keyword} 沒有符合條件的電影`)
  }
  //重製分頁器，讓分頁器顯示出搜尋結果的分頁
  renderPaginator(filteredMovies.length)
  //預設顯示第 1 頁的搜尋結果
  renderMovieList(getMoviesByPage(1))
})

function getMoviesByPage(page) {
  //利用三元運算子，如果搜尋清單有東西，就取搜尋清單 filteredMovies，否則就還是取總清單 movies
  //filteredMovies.length 會被轉換為 true
  const data = filteredMovies.length ? filteredMovies : movies
  //計算一開始的起點index
  const startIndex = (page - 1) * MOVIES_PER_PAGE
  return data.slice(startIndex, startIndex + MOVIES_PER_PAGE)
}

function renderPaginator(amount) {
  //計算總共需要多少頁數，將電影的總數量/每分頁的電影數量，若有餘數，則除出來的頁數自動+1
  const numberOfPages = Math.ceil(amount / MOVIES_PER_PAGE)
  //製作template
  let rawHTML = ''
  //將分頁完算出來總共要多少頁的結果，重新渲染回DOM
  for (let page = 1; page <= numberOfPages; page++) {
    rawHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`
  }
  //放回 HTML
  paginator.innerHTML = rawHTML
}

paginator.addEventListener('click', function onPaginatorClicked(event) {
  //如果被點擊的不是 a 標籤，結束
  if (event.target.tagName !== 'A') return
  //透過 dataset 取得被點擊的頁數
  //當我們要取得data-* attribute 的屬性值時，我們可以簡單利用 JavaScript 中的 dataset 物件，如下行就是利用 dataset.page 來取得 data-page 的屬性質
  const page = Number(event.target.dataset.page)
  //更新畫面
  renderMovieList(getMoviesByPage(page))
})

//直接展開
axios.get(INDEX_URL)
  .then((response) => {
    movies.push(...response.data.results)
    //將電影的總資料筆數傳進renderPaginator，renderPaginator函式進而算出總共需要多少分頁，渲染到畫面上
    renderPaginator(movies.length)
    renderMovieList(getMoviesByPage(1))
  }).catch((err) => console.log(err))