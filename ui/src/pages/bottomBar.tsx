import { Button } from "grommet"
import { AppsRounded } from "grommet-icons"


const BottomBar = () => {
    return (
        <div>
            <Button size="large" style={{ position: 'absolute', bottom: "5%", left: "50%", transform: 'translateX(-50%)' }} icon={<AppsRounded size="5vh"/>} />
        </div>
    )
}

export default BottomBar;