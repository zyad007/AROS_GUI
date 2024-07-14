import React from 'react';
import ReactModal from 'react-modal'

const PopupModal = ({ isOpen, setIsOpen, obstacle }
    : {
        isOpen: boolean,
        setIsOpen: Function,
        obstacle: any
    }
) => {

    const closeModal = () => {
        setIsOpen(false);
    }


    return (
        <div>
            <ReactModal
                appElement={document.getElementById('root')}
                isOpen={isOpen}
                className={'-translate-x-1/3 shadow-xl bg-slate-700 -translate-y-1/3 left-[40%] top-1/3 h-[80%] w-[60%] absolute flex flex-col justify-around items-center border p-20 pt-5 rounded-md bg-secondary-2 text-black'}
                shouldFocusAfterRender={false}
                onRequestClose={closeModal}
                closeTimeoutMS={200}
            >
                <div className='text-5xl text-white mb-4'>
                    {obstacle?.type} - {obstacle?.status}
                </div>
                <div className="w-full h-full space-y-2 flex justify-center items-center pr-1 bg-white rounded-lg">

                    {
                        obstacle.imageUrl && 
                        <img src={obstacle.imageUrl} />
                    }

                </div>

            </ReactModal>
        </div>
    );
}

export default PopupModal;
