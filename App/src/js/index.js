
const search = document.getElementById("searchField");
const searchBtn = document.getElementById("searchBtn");
const Anime = document.getElementById("Anime");


const onSearch = e => {
    e.preventDefault();
    if(Boolean(search.value)) {
        fetch(`https://kitsu.io/api/edge/anime?filter[text]=${search.value}`)
        .then(res => res.json())
        .then(res => {
            const html = res.data.map(item => 
                `
                <div class="row">
                    <div class="col s12 m7">
                        <div class="card">
                            <div class="card-image">
                            <img src="${item.attributes.posterImage.large}" width="50%" height="50%">
                            <span class="card-title">${item.attributes.abbreviatedTitles[0]}</span>
                            </div>
                            <div class="card-content" style="text-align:justify">
                            <p>${item.attributes.synopsis}</p>
                            </div>
                            <div class="card-action">
                            <a href="#">This is a link</a>
                            </div>
                        </div>
                    </div>
                </div>
                `
            ).join(' ');
            Anime.innerHTML = html;
        });
    }

}



searchBtn.addEventListener('click', onSearch);
