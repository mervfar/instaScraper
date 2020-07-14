const express = require('express');
const cors = require('cors');
const axios = require('axios');
const instagramRegExp = new RegExp(/<script type="text\/javascript">window\._sharedData = (.*);<\/script>/)




const app = express();


app.enable('trust proxy');

app.use(cors());
app.use(express.json());

app.get('/check', (req, res) => {
    res.json({
        message: 'Instagram Comment Scraper is Up!'
    });
});

app.get('/getMyComments/:username', (req, res) => {

    getMyAllComments(req.params.username).then(val => {
        res.json({
            message: 'Username is ' + req.params.username,
            data: val
        });
        //console.log("aha çalıştı: ", val)

    })
});



async function getMyAllComments(username) {
    var myArray = new Array()
    const photos = await fetchInstagramPhotos(username)

    try {

        for (let el of photos) {
            //console.log(el.url)
            let comment = await fetchPostComments(el.url);
            if (comment.length != 0) {
                comment.forEach(com => {
                    //console.log(com)
                    myArray.push(com)
                })
            }

        }

    } catch (e) {
        console.error('Fetching Instagram photos failed', e)
    }
    //console.log("ARRAY", myArray)
    return myArray
}


const fetchInstagramPhotos = async (username) => {
    const url = 'https://www.instagram.com/' + username + '/';
    const response = await axios.get(url)
    const json = JSON.parse(response.data.match(instagramRegExp)[1])
    const edges = json.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges;
    const photos = edges.map(({ node }) => {
        return {
            url: `https://www.instagram.com/p/${node.shortcode}/`,
            thumbnailUrl: node.thumbnail_src,
            displayUrl: node.display_url,
            caption: node.edge_media_to_caption.edges.length > 0 ? node.edge_media_to_caption.edges[0].node.text : ""
        }
    })
    return photos
}
const fetchPostComments = async (url) => {
    const response = await axios.get(url)
    const json = JSON.parse(response.data.match(instagramRegExp)[1])
    const edges = json.entry_data.PostPage[0].graphql.shortcode_media.edge_media_to_parent_comment.edges;
    const comments = edges.map(({ node }) => {
        return {
            text: node.text,
            username: node.owner.username,
            link: url
        }
    })
    return comments
}

app.listen(5000, () => {
    console.log('Listening on http://localhost:5000');
});