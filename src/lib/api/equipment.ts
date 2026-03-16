import pb from '#/lib/pocketbase';
import type { CreateEquipment, Equipment } from '#/types';

export const EquipmentApi = {
  getEquipment: async (page: number = 1, limit: number = 100) => {
    const equipment = await pb.collection('equipment').getList(page, limit);
    return equipment.items;
  },
  createEquipment: async (equipment: CreateEquipment) => {
    const newEquipment = await pb.collection('equipment').create(equipment);
    return newEquipment;
  },
  updateEquipment: async (id: string, equipment: Equipment) => {
    const updatedEquipment = await pb
      .collection('equipment')
      .update(id, equipment);
    return updatedEquipment;
  },
  deleteEquipment: async (id: string) => {
    const deletedEquipment = await pb.collection('equipment').delete(id);
    return deletedEquipment;
  },
  getEquipmentById: async (id: string) => {
    const equipment = await pb.collection('equipment').getOne(id);
    return equipment;
  },
};
