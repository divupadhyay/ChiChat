import {Box,Button,Container,HStack,Input,VStack} from "@chakra-ui/react"
import Message from "./component/Message";
import {onAuthStateChanged,getAuth,GoogleAuthProvider,signInWithPopup,signOut} from "firebase/auth"
import {app} from "./firebase";
import { useEffect, useRef, useState } from "react";
import {getFirestore,addDoc, collection, serverTimestamp,onSnapshot,query,orderBy} from "firebase/firestore";

const auth=getAuth(app);
const db=getFirestore(app);

const loginHandler=()=>{
  const provider=new GoogleAuthProvider();
  signInWithPopup(auth,provider)
};
const logoutHandler=()=>{
  signOut(auth);
}


function App() {
 
  const[user,setUser] =useState(false);
  const[message,setMessage] =useState("");
  const[messages,setMessages] =useState([]);

  const divforScroll=useRef(null);

  const submitHandler=async(e)=>{
    e.preventDefault();
    try{
      setMessage("");

      await addDoc(collection(db,"Messages"),{
        text:message,
        uid:user.uid,
        uri:user.photoURL,
        createdAt:serverTimestamp(),
      });
      
      divforScroll.current.scrollIntoView({behavior:"smooth"});
    }catch(error){
      alert(error)
    }
  }
  useEffect(()=>{
    const q=query(collection(db,"Messages"),orderBy("createdAt","asc"))
    const unsubsribe=onAuthStateChanged(auth,(data)=>{
      setUser(data);
    });
    const unsubscibeForMessage = onSnapshot(q,(snap)=>{
      setMessages(
        snap.docs.map((item)=>{
          const id=item.id;
          return {id, ...item.data()};
        })
      );
    });
    return()=>{
      unsubsribe();
      unsubscibeForMessage();
    };
  },[]);
  return (
    <Box bg="blue.50">
      {
        user?(
          <Container h={"100vh"} bg={"white"}>
        <VStack h="full" paddingY="4">
          <Button onClick={logoutHandler} w="full" colorScheme={"green"}>SignOut</Button>
          <VStack h={"full"} w={"full"} bg="green.100" overflowY={"auto"} css={{"&::-webkit-scrollbar":{display:"none"}}}>
            {
              messages.map(item=>(
                <Message 
                key={item.id}
                user={item.uid===user.uid?"me":"other"} 
                text={item.text} 
                uri={item.uri}/>
              ))
            }
            <div ref={divforScroll}></div>
          </VStack>
          
          <form onSubmit={submitHandler} style={{width:"100%"}}>
            <HStack>
            <Input value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Enter a Message"/>
            <Button type="submit" colorScheme={"green"}>Send</Button>
            </HStack>
          </form>
        </VStack>
      </Container>
        ):(
        <VStack  justifyContent={"center"} h={"100vh"}>
          <Button onClick={loginHandler} colorScheme="purple">
            Sign in with Google
          </Button>
        </VStack>
        )
      }
    </Box>
  );
}

export default App;
