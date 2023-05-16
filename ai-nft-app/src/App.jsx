import { useState } from 'react'
import { NFTStorage } from 'nft.storage'
import axios from 'axios'


function App() {
  const [prompt, setPrompt] = useState("")
  const [imageBlob, setImageBlob] = useState(null)
  const [isloading, setIsLoading] = useState(false)
  const [isLoadingButton, setIsLoadingButton] = useState(false)
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");


  const generateArt = async () => {
    setIsLoading(true)
    try {
      const response = await axios.post(
        "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_APP_HUGGING_FACE}`
          },
          method: "POST",
          inputs: prompt,
        },
        { responseType: "blob" }
      );

      const file = new File([response.data], "image.png", { type: "image/png" });

      setFile(file)


      const url = URL.createObjectURL(response.data)

      setIsLoading(false)
      setImageBlob(url)

    } catch (error) {
      setIsLoading(false)
      alert(error)
    }
  }

  const uploadArtToIPFS = async () => {
    try {
      const nftStorage = new NFTStorage({
        token:
          import.meta.env.VITE_APP_NFT_STORAGE
      })

      const store = await nftStorage.store({
        name: name,
        description: description,
        image: file
      })

      return replaceURL(store.data.image.href)
    }
    catch (error) {
      alert(error)
      return null
    }
  }

  const replaceURL = (url) => {
    if (url.includes("ipfs://")) {
      return url.replace("ipfs://", "https://ipfs.io/ipfs/")
    }
  }

  const mintNFT = async () => {
    setIsLoadingButton(true)
    try {
      const imageURL = await uploadArtToIPFS();

      const response = await axios.post(
        `https://api.nftport.xyz/v0/mints/easy/urls`,
        {
          file_url: imageURL,
          chain: "polygon",
          name: name,
          description: description,
          mint_to_address: address
        },
        {
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            Authorization: import.meta.env.VITE_APP_NFT_PORT,
          }
        }
      )
      const data = await response.data;
      alert(" NFT minted Successfully , visit opensea.io and connect your wallet, go to more section and press hidden, you will find your AI generated NFT ",)

      setIsLoadingButton(false)

    }
    catch (error) {
      setIsLoadingButton(false)
      alert(error)
    }
  }

  return (
    <>
      <div className='flex flex-col items-center justify-center min-h-screen gap-4 '>
        <h1 className='text-4xl font-extrabold'>
          AI art gasless mints
        </h1>
        <div className='flex gap-4 items-center justify-center'>
          <input className='border-2 border-black rounded-md p-2' type="text" placeholder='Enter prompt' onChange={(e) => {
            setPrompt(e.target.value)
          }} />
          <button onClick={generateArt} className='bg-black text-white rounded-md px-4 py-2'  >Next</button>


        </div>

        {isloading &&
          <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading">
          </div>

        }


        {imageBlob &&
          <div className='flex flex-col gap-4 items-c' justify-center>

            <img src={imageBlob} alt='AI-NFT-Art' />
            <form className='flex flex-col gap-4'  >

              <input className='border-2 border-black rounded-md p-2' name='name' type="text" placeholder='Enter NFT name' onChange={(e) => {
                setName(e.target.value)
              }} />
              <input className='border-2 border-black rounded-md p-2' name='description' type="text" placeholder='Enter description' onChange={(e) => {
                setDescription(e.target.value)
              }} />
              <input className='border-2 border-black rounded-md p-2' name='address' type="text" placeholder='Enter address' onChange={(e) => {
                setAddress(e.target.value)
              }} />



              <button onClick={mintNFT} type='reset' name='mintButton' className='bg-black text-white rounded-md py-2 items-center flex justify-center ' >
                {isLoadingButton &&

                  <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full mr-6" role="status" aria-label="loading">
                  </div>

                }
                Upload to IPFS</button>

            </form>
          </div>
        }
      </div>
    </>
  )
}

export default App
