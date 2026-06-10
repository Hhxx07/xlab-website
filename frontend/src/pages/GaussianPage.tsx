import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { worldModules } from '../features/world/data/worldModules'
import { useWorldStore } from '../features/world/store/worldStore'
import GaussianViewer from '../features/world/gaussian/GaussianViewer'

export default function GaussianPage() {
  const { houseId } = useParams<{ houseId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const module = worldModules.find((m) => m.id === houseId)
  const houseName = module?.name ?? houseId ?? 'Unknown'
  const plyUrl = `/gaussian/${houseId}/scene.ply`

  const handleReturn = () => {
    const returnPos = (location.state as { returnPosition?: [number, number, number] })?.returnPosition
    if (returnPos) {
      useWorldStore.getState().setPlayerPosition(returnPos)
    }
    navigate('/world')
  }

  return (
    <GaussianViewer
      plyUrl={plyUrl}
      houseName={houseName}
      onReturn={handleReturn}
    />
  )
}
